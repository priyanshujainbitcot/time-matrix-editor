'use client';

import { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Link, Underline, Strikethrough, List, ListOrdered, Image as ImageIcon, Minus, Plus, FileText } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateNote, updateNoteTitle, addNote } from '@/store/slices/notesSlice';
import { createNote, db, getCurrentTimestamp } from '@/services/databaseService';
import Toast, { ToastType } from '@/components/ui/Toast';

const escapeHtml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const renderInlineMarkdown = (value: string) => {
    const replacements: string[] = [];
    const markdownUrl = '(https?:\\/\\/(?:[^()\\s]|\\([^()\\s]*\\))+)';
    let rendered = escapeHtml(value).replace(new RegExp(`!\\[([^\\]]*)\\]\\(${markdownUrl}\\)`, 'g'), (_, alt, url) => {
        const placeholder = `@@MDREPL${replacements.length}@@`;
        replacements.push(`<img src="${url}" alt="${alt}" />`);
        return placeholder;
    }).replace(new RegExp(`\\[([^\\]]*)\\]\\(${markdownUrl}\\)`, 'g'), (_, label, url) => {
        const placeholder = `@@MDREPL${replacements.length}@@`;
        replacements.push(`<a href="${url}" target="_blank" rel="noopener noreferrer">${renderInlineMarkdown(label || url)}</a>`);
        return placeholder;
    });

    rendered = rendered
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/__([^_]+)__/g, '<strong>$1</strong>')
        .replace(/~~([^~]+)~~/g, '<s>$1</s>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/_([^_]+)_/g, '<em>$1</em>');

    return rendered.replace(/@@MDREPL(\d+)@@/g, (_, index) => replacements[Number(index)]);
};

const markdownToHtml = (markdown: string) => {
    const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
    const html: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const closeList = () => {
        if (listType) {
            html.push(`</${listType}>`);
            listType = null;
        }
    };

    lines.forEach(line => {
        const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+)$/);
        const unorderedItem = line.match(/^\s*[-*+]\s+(.+)$/);
        const orderedItem = line.match(/^\s*\d+[.)]\s+(.+)$/);
        const blockquote = line.match(/^\s*>\s?(.*)$/);

        if (heading) {
            closeList();
            const level = heading[1].length;
            html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
        } else if (unorderedItem || orderedItem) {
            const item = (unorderedItem || orderedItem)![1];
            if (/^\[\]\(https?:\/\/.+\)$/.test(item.trim())) return;
            const nextType = unorderedItem ? 'ul' : 'ol';
            if (listType !== nextType) {
                closeList();
                listType = nextType;
                html.push(`<${listType}>`);
            }
            html.push(`<li>${renderInlineMarkdown(item)}</li>`);
        } else if (blockquote) {
            closeList();
            html.push(`<blockquote>${renderInlineMarkdown(blockquote[1])}</blockquote>`);
        } else if (/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
            closeList();
            html.push('<hr />');
        } else if (line.trim()) {
            closeList();
            html.push(`<p>${renderInlineMarkdown(line)}</p>`);
        } else {
            closeList();
        }
    });

    closeList();
    return html.join('');
};

const ToolbarButton = ({ onMouseDown, title, children, className = '' }: {
    onMouseDown: (e: React.MouseEvent) => void;
    title: string;
    children: React.ReactNode;
    className?: string;
}) => (
    <button
        onMouseDown={onMouseDown}
        title={title}
        className={`p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all cursor-pointer ${className}`}
    >
        {children}
    </button>
);

const ToolbarDivider = () => <div className="w-px h-5 bg-gray-200 mx-1.5" />;

export default function RichTextEditor() {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const linkSelectionRef = useRef<Range | null>(null);
    const dispatch = useAppDispatch();
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [toast, setToast] = useState<{ type: ToastType; message: string; visible: boolean }>({
        type: 'error',
        message: '',
        visible: false,
    });

    const activeNoteId = useAppSelector(state => state.notes.activeNoteId);
    const activeNote = useAppSelector(state => state.notes.items.find(n => n.id === activeNoteId));


    useEffect(() => {
        if (activeNote) {
            const content = activeNote.content || '';
            const isRawMarkdown = !/<[a-z][\s\S]*>/i.test(content)
                && /(^|\n)\s*(#{1,6}\s|[-*+]\s+\S|\d+[.)]\s+\S|!\[)/m.test(content);
            const formattedContent = isRawMarkdown ? markdownToHtml(content) : content;

            if (editorRef.current && editorRef.current.innerHTML !== formattedContent) {
                editorRef.current.innerHTML = formattedContent;
            }

            if (isRawMarkdown) {
                dispatch(updateNote({ id: activeNote.id, content: formattedContent, title: activeNote.title }));
                void db.notes.update(activeNote.id, {
                    content: formattedContent,
                    updatedAt: Date.now(),
                });
            }
        } else {
            if (editorRef.current) {
                editorRef.current.innerHTML = '';
            }
        }
    }, [activeNoteId, activeNote, dispatch]);

    const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        if (!activeNote) return;

        dispatch(updateNoteTitle({ id: activeNote.id, title: newTitle }));
        try {
            await db.notes.update(activeNote.id, {
                title: newTitle,
                updatedAt: getCurrentTimestamp(),
            });
        } catch (error) {
            console.error('Failed to save note title:', error);
            showLinkError('Could not save note title.');
        }
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;

        e.preventDefault();
        editorRef.current?.focus();
    };

    const formatText = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        saveContent();
    };


    const handleToolbarMouseDown = (e: React.MouseEvent, command: string, value?: string) => {
        e.preventDefault();
        formatText(command, value);
    };

    const showLinkError = (message: string) => {
        setToast({ type: 'error', message, visible: true });
    };

    const handleLinkMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const selection = window.getSelection();
        linkSelectionRef.current = selection && !selection.isCollapsed ? selection.getRangeAt(0).cloneRange() : null;
        setLinkUrl('');
        setIsLinkDialogOpen(true);
    };

    const handleLinkSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const url = linkUrl.trim();
        if (!url) {
            showLinkError('Enter a web or email address to add a link.');
            return;
        }

        let parsedUrl: URL;
        try {
            const normalizedUrl = /^[a-z][a-z\d+.-]*:/i.test(url) ? url : `https://${url}`;
            parsedUrl = new URL(normalizedUrl);
        } catch {
            showLinkError('Enter a valid web or email address.');
            return;
        }

        if (!['http:', 'https:', 'mailto:'].includes(parsedUrl.protocol)) {
            showLinkError('Only web and email links are supported.');
            return;
        }

        const selection = window.getSelection();
        const savedRange = linkSelectionRef.current;
        if (savedRange && editorRef.current) {
            selection?.removeAllRanges();
            selection?.addRange(savedRange);
        }

        if (!savedRange || savedRange.collapsed) {
            document.execCommand('insertHTML', false, `<a href="${parsedUrl.href}" target="_blank" rel="noopener noreferrer">${escapeHtml(parsedUrl.href)}</a>`);
        } else {
            document.execCommand('createLink', false, parsedUrl.href);
        }

        editorRef.current?.focus();
        saveContent();
        linkSelectionRef.current = null;
        setLinkUrl('');
        setIsLinkDialogOpen(false);
    };

    const handleImageMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        fileInputRef.current?.click();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const base64Image = reader.result as string;
            const imgHtml = `<img src="${base64Image}" style="max-width: 100%; border-radius: 8px; margin: 16px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08);" />`;
            document.execCommand('insertHTML', false, imgHtml);
            saveContent();
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        const text = e.clipboardData.getData('text/plain');
        if (!text || !/[#*_~\[\]\(\)]/.test(text)) return;

        e.preventDefault();
        document.execCommand('insertHTML', false, markdownToHtml(text));
        saveContent();
    };

    const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const link = (e.target as HTMLElement).closest('a');
        if (link) {
            e.preventDefault();
            window.open(link.href, '_blank', 'noopener,noreferrer');
        }
    };

    const saveContent = async () => {
        if (!editorRef.current || !activeNote) return;
        const content = editorRef.current.innerHTML;
        const currentTitle = activeNote.title || 'Untitled Note';

        dispatch(updateNote({ id: activeNote.id, content, title: currentTitle }));

        try {
            await db.notes.update(activeNote.id, {
                content,
                title: currentTitle,
                updatedAt: Date.now()
            });
        } catch (error) {
            console.error('Failed to save note content:', error);
            showLinkError('Could not save note changes.');
        }
    };

    const handleCreateNote = async () => {
        const newNote = await createNote();
        dispatch(addNote(newNote));
    };

    const handleToastDone = () => {
        setToast(prev => ({ ...prev, visible: false }));
    };

    if (!activeNoteId || !activeNote) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full bg-background text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4 shadow-xs">
                    <FileText size={32} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">No note selected</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
                    Select a note from the sidebar or create a new one to start writing immediately.
                </p>
                <button
                    onClick={handleCreateNote}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                    <Plus size={16} strokeWidth={2.5} />
                    <span>Create New Note</span>
                </button>
            </div>
        );
    }


    return (
        <>
            <style>{`
                .editor-scroll::-webkit-scrollbar {
                    width: 5px;
                }
                .editor-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .editor-scroll::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 10px;
                }
                .editor-scroll::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
            `}</style>

            <div className="flex flex-col w-full h-full bg-background overflow-hidden">

                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/90 backdrop-blur-xs shrink-0">
                    <div className="flex items-center gap-0.5">

                        <ToolbarButton
                            onMouseDown={(e) => handleToolbarMouseDown(e, 'bold')}
                            title="Bold (Ctrl+B)"
                        >
                            <Bold size={16} strokeWidth={2.5} />
                        </ToolbarButton>
                        <ToolbarButton
                            onMouseDown={(e) => handleToolbarMouseDown(e, 'italic')}
                            title="Italic (Ctrl+I)"
                        >
                            <Italic size={16} strokeWidth={2.5} />
                        </ToolbarButton>
                        <ToolbarButton
                            onMouseDown={handleLinkMouseDown}
                            title="Insert link"
                        >
                            <Link size={16} strokeWidth={2.5} />
                        </ToolbarButton>
                        <ToolbarButton
                            onMouseDown={(e) => handleToolbarMouseDown(e, 'underline')}
                            title="Underline (Ctrl+U)"
                        >
                            <Underline size={16} strokeWidth={2.5} />
                        </ToolbarButton>
                        <ToolbarButton
                            onMouseDown={(e) => handleToolbarMouseDown(e, 'strikeThrough')}
                            title="Strikethrough"
                        >
                            <Strikethrough size={16} strokeWidth={2.5} />
                        </ToolbarButton>

                        <ToolbarDivider />

                        <ToolbarButton
                            onMouseDown={(e) => handleToolbarMouseDown(e, 'insertUnorderedList')}
                            title="Bullet list"
                        >
                            <List size={16} strokeWidth={2.5} />
                        </ToolbarButton>
                        <ToolbarButton
                            onMouseDown={(e) => handleToolbarMouseDown(e, 'insertOrderedList')}
                            title="Numbered list"
                        >
                            <ListOrdered size={16} strokeWidth={2.5} />
                        </ToolbarButton>

                        <ToolbarDivider />

                        <ToolbarButton
                            onMouseDown={(e) => handleToolbarMouseDown(e, 'insertHorizontalRule')}
                            title="Divider"
                        >
                            <Minus size={16} strokeWidth={2.5} />
                        </ToolbarButton>
                        <ToolbarButton
                            onMouseDown={handleImageMouseDown}
                            title="Insert image"
                            className="hover:text-blue-600"
                        >
                            <ImageIcon size={16} strokeWidth={2.5} />
                        </ToolbarButton>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    </div>

                    <div className="text-[11px] font-medium text-muted-foreground">
                        Auto-saved
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 bg-background dark:bg-black editor-scroll">
                    <div className="w-full flex flex-col min-h-full bg-background dark:bg-black">
                        <input
                            type="text"
                            value={activeNote.title || ''}
                            onChange={handleTitleChange}
                            onKeyDown={handleTitleKeyDown}
                            placeholder="Untitled Note"
                            className="note-title-input w-full text-3xl font-extrabold text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white selection:bg-blue-100 dark:selection:bg-blue-700 dark:selection:text-white outline-none bg-transparent dark:bg-transparent mb-1 pb-2 border-b border-transparent focus:border-border"
                        />

                        <div
                            ref={editorRef}
                            contentEditable={true}
                            onPaste={handlePaste}
                            onClick={handleEditorClick}
                            onInput={saveContent}
                            onBlur={saveContent}
                            className="flex-1 outline-none bg-background dark:bg-black text-foreground leading-relaxed text-base selection:bg-blue-100 dark:selection:bg-blue-700 dark:selection:text-white min-h-100"
                            data-placeholder="Start typing your note here..."
                        />
                    </div>
                </div>
            </div>
            {isLinkDialogOpen && (
                <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/30 px-4 backdrop-blur-xs">
                    <form onSubmit={handleLinkSubmit} className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
                        <div className="mb-4">
                            <h2 className="text-base font-semibold text-foreground">Add link</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Enter the web or email address for this text.</p>
                        </div>
                        <label htmlFor="note-link-url" className="mb-1.5 block text-sm font-medium text-foreground">URL</label>
                        <input
                            id="note-link-url"
                            type="text"
                            value={linkUrl}
                            onChange={e => setLinkUrl(e.target.value)}
                            placeholder="https://example.com"
                            autoFocus
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsLinkDialogOpen(false)}
                                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                            >
                                Add link
                            </button>
                        </div>
                    </form>
                </div>
            )}
            <Toast
                type={toast.type}
                message={toast.message}
                visible={toast.visible}
                onDone={handleToastDone}
            />
        </>
    );
}