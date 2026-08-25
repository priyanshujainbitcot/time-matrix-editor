'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, FileText, FileDown, Loader2 } from 'lucide-react';
import RichTextEditor from '@/components/domain/RichTextEditor';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setNotes, addNote, setActiveNote, deleteNote } from '@/store/slices/notesSlice';
import { createNote, db } from '@/services/databaseService';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Toast, { ToastType } from '@/components/ui/Toast';
import type { TVirtualFileSystem } from 'pdfmake/interfaces';

type PdfMakeApi = {
    vfs?: Record<string, string>;
    createPdf: (definition: unknown) => { download: (filename: string) => void };
};

type PdfMakeModule = PdfMakeApi | { default: PdfMakeApi };
type PdfFonts = {
    pdfMake?: { vfs?: TVirtualFileSystem };
    vfs?: TVirtualFileSystem;
    default?: TVirtualFileSystem;
};
type HtmlToPdfMakeModule = HtmlToPdfMake | { default: HtmlToPdfMake };

type HtmlToPdfMake = (html: string) => unknown[];

export default function ShowNotesPage() {
    const dispatch = useAppDispatch();
    const notes = useAppSelector(state => state.notes.items);
    const activeNoteId = useAppSelector(state => state.notes.activeNoteId);

    // Confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [pendingDeleteTitle, setPendingDeleteTitle] = useState('');

    // Toast state
    const [toast, setToast] = useState<{ type: ToastType; message: string; visible: boolean }>({
        type: 'deleted',
        message: '',
        visible: false,
    });

    // Export loading state
    const [isExporting, setIsExporting] = useState(false);

    const showToast = useCallback((type: ToastType, message: string) => {
        setToast({ type, message, visible: true });
    }, []);

    const handleToastDone = useCallback(() => {
        setToast(prev => ({ ...prev, visible: false }));
    }, []);

    useEffect(() => {
        const loadNotes = async () => {
            try {
                const savedNotes = await db.notes.orderBy('updatedAt').reverse().toArray();
                dispatch(setNotes(savedNotes));
                if (savedNotes.length > 0) {
                    const activeNoteStillExists = activeNoteId
                        && savedNotes.some(note => note.id === activeNoteId);
                    dispatch(setActiveNote(activeNoteStillExists ? activeNoteId : savedNotes[0].id));
                } else {
                    dispatch(setActiveNote(null));
                }
            } catch (error) {
                console.error('Failed to load notes:', error);
                showToast('error', 'Could not load notes');
            }
        };
        loadNotes();
    }, [activeNoteId, dispatch, showToast]);

    const handleCreateNote = async () => {
        try {
            const newNote = await createNote();
            dispatch(addNote(newNote));
        } catch (error) {
            console.error('Failed to create note:', error);
            showToast('error', 'Could not create note');
        }
    };

    const handleDeleteClick = (id: string, title: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setPendingDeleteId(id);
        setPendingDeleteTitle(title || 'Untitled Note');
        setConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!pendingDeleteId) return;

        try {
            await db.notes.delete(pendingDeleteId);
            dispatch(deleteNote(pendingDeleteId));
        } catch (error) {
            console.error('Failed to delete note:', error);
            showToast('error', 'Could not delete note');
            return;
        }

        setConfirmOpen(false);
        setPendingDeleteId(null);
        setPendingDeleteTitle('');
        showToast('deleted', 'Note deleted');
    };

    const handleDeleteCancel = () => {
        setConfirmOpen(false);
        setPendingDeleteId(null);
        setPendingDeleteTitle('');
    };

    const formatNoteDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
        }

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
        }

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    
    // --- PROFESSIONAL PDF EXPORT FUNCTIONALITY ---
    const handleExportNote = async () => {
        if (!activeNoteId) {
            showToast('error', 'No note selected to export');
            return;
        }

        const activeNote = notes.find(n => n.id === activeNoteId);
        if (!activeNote) {
            showToast('error', 'Selected note not found');
            return;
        }

        setIsExporting(true);

        try {
            // Dynamically import libraries
            const pdfMakeModule = await import('pdfmake/build/pdfmake') as unknown as PdfMakeModule;
            const pdfFontsModule = await import('pdfmake/build/vfs_fonts') as unknown as PdfFonts;
            const htmlToPdfmakeModule = await import('html-to-pdfmake') as unknown as HtmlToPdfMakeModule;

            const pdfMake = 'default' in pdfMakeModule ? pdfMakeModule.default : pdfMakeModule;
            const htmlToPdfmake = 'default' in htmlToPdfmakeModule ? htmlToPdfmakeModule.default : htmlToPdfmakeModule;
            const pdfFonts = (pdfFontsModule.default || pdfFontsModule) as PdfFonts;
            const embeddedFonts = pdfFonts as unknown as TVirtualFileSystem;
            if (!htmlToPdfmake) throw new Error('Could not load HTML to PDF converter.');

            // Bulletproof VFS extraction
            let vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs || (window as Window & { pdfMake?: PdfMakeApi }).pdfMake?.vfs;
            if (!vfs) {
                if (embeddedFonts["Roboto-Regular.ttf"]) {
                    vfs = embeddedFonts;
                }
            }
            if (!vfs) throw new Error("Could not locate PDF VFS fonts.");
            pdfMake.vfs = vfs;

            const title = activeNote.title || 'Untitled Note';
            const content = activeNote.content || '';

            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            const images = doc.querySelectorAll('img');
            
            const maxPdfWidthPt = 515;

            // Wait for all images to be fetched, converted to JPEG via canvas, and measured
            await Promise.all(Array.from(images).map(async (img) => {
                const originalSrc = img.getAttribute('src');
                if (!originalSrc) return;

                try {
                    let imageSrcToLoad = originalSrc;

                    // Fetch HTTP images as a Blob first to avoid some tainted canvas issues
                    if (originalSrc.startsWith('http')) {
                        const response = await fetch(originalSrc);
                        if (!response.ok) throw new Error('Failed to fetch external image');
                        const blob = await response.blob();
                        imageSrcToLoad = URL.createObjectURL(blob);
                    }

                    await new Promise<void>((resolve, reject) => {
                        const tempImg = new Image();
                        tempImg.onload = () => {
                            try {
                                // Draw on canvas and export as JPEG (Forcing pdfmake compatibility)
                                const canvas = document.createElement('canvas');
                                canvas.width = tempImg.naturalWidth;
                                canvas.height = tempImg.naturalHeight;
                                const ctx = canvas.getContext('2d');
                                
                                if (ctx) {
                                    ctx.fillStyle = '#FFFFFF'; // Fill white for transparent images (since JPEG doesn't support transparency)
                                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                                    ctx.drawImage(tempImg, 0, 0);
                                    
                                    const jpegBase64 = canvas.toDataURL('image/jpeg', 0.9);
                                    img.setAttribute('src', jpegBase64);
                                }

                                // Handle PDF sizing
                                const styleWidth = img.getAttribute('style') || '';
                                const widthMatch = styleWidth.match(/width:\s*(\d+)px/i);
                                
                                let widthPt = widthMatch && widthMatch[1] 
                                    ? parseInt(widthMatch[1], 10) * 0.75 
                                    : tempImg.naturalWidth * 0.75;
                                
                                if (widthPt > maxPdfWidthPt) widthPt = maxPdfWidthPt; // Cap to page width
                                
                                img.setAttribute('width', String(Math.round(widthPt)));
                                img.removeAttribute('height');
                                img.removeAttribute('style');
                                resolve();
                            } catch (err) {
                                reject(err);
                            }
                        };
                        
                        tempImg.onerror = () => reject(new Error('Image load error'));
                        tempImg.src = imageSrcToLoad;
                    });
                } catch (error) {
                    console.warn(`Failed to process image format: ${originalSrc}. Removing to prevent PDF crash.`, error);
                    img.remove(); // Remove failing images safely
                }
            }));

            const sanitizedContent = doc.body.innerHTML;

            // Translate the sanitized HTML content into pdfmake's JSON structure
            let translatedContent = htmlToPdfmake(sanitizedContent);

            // Ensure translatedContent is always an array
            if (!translatedContent) {
                translatedContent = [];
            } else if (!Array.isArray(translatedContent)) {
                translatedContent = [translatedContent];
            }

            // Define professional document layout
            const docDefinition = {
                content: [
                    { text: title, style: 'header' },
                    { text: '', margin: [0, 0, 0, 10] },
                    ...translatedContent
                ],
                styles: {
                    header: {
                        fontSize: 28,
                        bold: true,
                        color: '#111827',
                        margin: [0, 0, 0, 5]
                    }
                },
                defaultStyle: {
                    fontSize: 12,
                    color: '#374151',
                    lineHeight: 1.5,
                    font: 'Roboto' 
                },
                pageSize: 'A4',
                pageMargins: [40, 60, 40, 60],
            };

            const safeFilename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'note';
            pdfMake.createPdf(docDefinition).download(`${safeFilename}.pdf`);

            showToast('success', 'Note exported as PDF successfully');
        } catch (error) {
            console.error('Failed to export note as PDF:', error);
            showToast('error', 'Failed to export note as PDF');
        } finally {
            setIsExporting(false);
        }
    };
    
    return (
        <div className="flex h-full w-full bg-background overflow-hidden">

            <div className="w-80 flex flex-col bg-muted/70 border-r border-border h-full overflow-hidden shrink-0">

                <div className="flex justify-between items-center px-5 py-4 border-b border-border bg-card">
                    <div>
                        <h2 className="text-sm font-bold text-foreground tracking-tight">All Notes</h2>
                        <p className="text-[11px] text-muted-foreground">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Export to PDF Button */}
                        <button
                            onClick={handleExportNote}
                            disabled={isExporting || !activeNoteId}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-foreground bg-muted hover:bg-accent border border-border rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Export current note to PDF"
                        >
                            {isExporting ? (
                                <Loader2 size={14} strokeWidth={2.5} className="animate-spin" />
                            ) : (
                                <FileDown size={14} strokeWidth={2.5} />
                            )}
                            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
                        </button>
                        <button
                            onClick={handleCreateNote}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                            title="New note"
                        >
                            <Plus size={14} strokeWidth={2.5} />
                            <span>New Note</span>
                        </button>
                    </div>
                </div>

                <ul className="notes-scroll grow overflow-y-auto divide-y divide-border">
                    {notes.length === 0 ? (
                        <li className="flex flex-col items-center justify-center py-20 px-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                                <FileText size={22} />
                            </div>
                            <p className="text-sm font-medium text-foreground">No notes yet</p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-45">Create your first note to start writing</p>
                            <button
                                onClick={handleCreateNote}
                                className="mt-4 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                            >
                                + Create Note
                            </button>
                        </li>
                    ) : (
                        notes.map(note => (
                            <li
                                key={note.id}
                                onClick={() => dispatch(setActiveNote(note.id))}
                                className={`px-5 py-3.5 cursor-pointer transition-all group border-l-3 ${activeNoteId === note.id
                                    ? 'bg-card border-l-blue-600 shadow-xs'
                                    : 'border-l-transparent hover:bg-accent'
                                    }`}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                        <h3 className={`text-sm font-semibold truncate leading-tight ${activeNoteId === note.id ? 'text-blue-600' : 'text-foreground'
                                            }`}>
                                            {note.title || 'Untitled Note'}
                                        </h3>
                                        <p className="text-[11px] text-muted-foreground mt-1">
                                            {formatNoteDate(note.updatedAt)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteClick(note.id, note.title, e)}
                                        className="p-1 text-muted-foreground hover:text-red-500 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-red-50 dark:hover:bg-red-950/60 shrink-0 cursor-pointer"
                                        title="Delete note"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
                <RichTextEditor />
            </div>

            <ConfirmDialog
                open={confirmOpen}
                title="Are you sure you want to delete this note?"
                message={`"${pendingDeleteTitle}" will be permanently deleted. This action cannot be undone.`}
                confirmLabel="Yes, delete"
                variant="danger"
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
            />

            <Toast
                type={toast.type}
                message={toast.message}
                visible={toast.visible}
                onDone={handleToastDone}
            />
        </div>
    );
}