'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { 
    Bold, Italic, Link, Link2Off, Underline, Strikethrough, 
    List, ListOrdered, Image as ImageIcon, Minus, Plus, FileText, 
    AlignLeft, AlignCenter, AlignRight, AlignJustify, 
    Palette, Highlighter, Code 
} from 'lucide-react';
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

const sanitizeNoteHtml = (html: string) => DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|data:image\/(?:gif|jpe?g|png|webp|bmp|svg\+xml);)/i,
});

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

const ToolbarButton = ({ onMouseDown, title, children, className = '', active = false }: {
    onMouseDown: (e: React.MouseEvent) => void;
    title: string;
    children: React.ReactNode;
    className?: string;
    active?: boolean;
}) => (
    <button
        onMouseDown={onMouseDown}
        title={title}
        className={`p-2 rounded-lg transition-all cursor-pointer ${active ? 'bg-blue-50 text-blue-600' : 'text-muted-foreground hover:text-foreground hover:bg-accent'} ${className}`}
    >
        {children}
    </button>
);

const ToolbarDivider = () => <div className="w-px h-5 bg-gray-200 mx-1.5 shrink-0" />;

// Helper to convert rgb(x,y,z) to #hex for native color inputs
const rgbToHex = (rgb: string) => {
    if (!rgb) return '';
    if (rgb.startsWith('#')) return rgb;
    const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!match) return '#000000';
    return '#' + [1, 2, 3].map(i => parseInt(match[i]).toString(16).padStart(2, '0')).join('');
};

export default function RichTextEditor() {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const linkSelectionRef = useRef<Range | null>(null);
    const savedSelectionRef = useRef<Range | null>(null); 
    const dispatch = useAppDispatch();
    
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [isEditingLink, setIsEditingLink] = useState(false);
    const linkElementRef = useRef<HTMLAnchorElement | null>(null);
    const imageElementRef = useRef<HTMLImageElement | null>(null);
    const imageSelectionRef = useRef<Range | null>(null);
    
    const [activeFormats, setActiveFormats] = useState<Record<string, any>>({});
    
    const [toast, setToast] = useState<{ type: ToastType; message: string; visible: boolean }>({
        type: 'error',
        message: '',
        visible: false,
    });

    const activeNoteId = useAppSelector(state => state.notes.activeNoteId);
    const activeNote = useAppSelector(state => state.notes.items.find(n => n.id === activeNoteId));
    const pendingSaveRef = useRef<{ id: string; content: string; title: string } | null>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const saveQueueRef = useRef(Promise.resolve());

    function showLinkError(message: string) {
        setToast({ type: 'error', message, visible: true });
    }

    const enqueueNoteSave = useCallback((note: { id: string; content: string; title: string }) => {
        saveQueueRef.current = saveQueueRef.current
            .catch(() => undefined)
            .then(async () => {
                try {
                    await db.notes.update(note.id, {
                        content: note.content,
                        title: note.title,
                        updatedAt: getCurrentTimestamp(),
                    });
                } catch (error) {
                    console.error('Failed to save note changes:', error);
                    showLinkError('Could not save note changes.');
                }
            });
    }, []);

    const flushPendingSave = useCallback(() => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }

        const pendingSave = pendingSaveRef.current;
        pendingSaveRef.current = null;
        if (pendingSave) enqueueNoteSave(pendingSave);
    }, [enqueueNoteSave]);

    const scheduleNoteSave = useCallback((note: { id: string; content: string; title: string }) => {
        pendingSaveRef.current = note;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(flushPendingSave, 300);
    }, [flushPendingSave]);

    // Track active formatting (Bold, Italic, Colors, Size, etc.) when selection changes
    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();
            if (!selection || !editorRef.current) return;
            
            if (!editorRef.current.contains(selection.anchorNode)) return;
            
            // Find current block element for formatBlock active state
            let parentElement = selection.anchorNode?.parentElement;
            let blockTag = 'p';
            let currentFontSize = '';
            
            while (parentElement && parentElement !== editorRef.current) {
                if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE'].includes(parentElement.tagName)) {
                    blockTag = parentElement.tagName.toLowerCase();
                }
                if (!currentFontSize && parentElement.style.fontSize) currentFontSize = parentElement.style.fontSize;
                parentElement = parentElement.parentElement;
            }

            const qForeColor = document.queryCommandValue('foreColor');
            const qHiliteColor = document.queryCommandValue('hiliteColor') || document.queryCommandValue('backColor');
            
            setActiveFormats({
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
                strikeThrough: document.queryCommandState('strikeThrough'),
                insertUnorderedList: document.queryCommandState('insertUnorderedList'),
                insertOrderedList: document.queryCommandState('insertOrderedList'),
                justifyLeft: document.queryCommandState('justifyLeft'),
                justifyCenter: document.queryCommandState('justifyCenter'),
                justifyRight: document.queryCommandState('justifyRight'),
                justifyFull: document.queryCommandState('justifyFull'),
                formatBlock: blockTag,
                fontSize: currentFontSize,
                foreColor: qForeColor ? rgbToHex(qForeColor) : '#000000',
                hiliteColor: qHiliteColor && qHiliteColor !== 'transparent' ? rgbToHex(qHiliteColor) : '#ffff00'
            });
        };
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, []);

    useEffect(() => {
        if (pendingSaveRef.current && pendingSaveRef.current.id !== activeNoteId) {
            flushPendingSave();
        }

        if (activeNote) {
            const content = activeNote.content || '';
            const isRawMarkdown = !/<[a-z][\s\S]*>/i.test(content)
                && /(^|\n)\s*(#{1,6}\s|[-*+]\s+\S|\d+[.)]\s+\S|!\[)/m.test(content);
            const formattedContent = sanitizeNoteHtml(isRawMarkdown ? markdownToHtml(content) : content);

            if (editorRef.current && editorRef.current.innerHTML !== formattedContent) {
                editorRef.current.innerHTML = formattedContent;
            }

            if (isRawMarkdown) {
                dispatch(updateNote({ id: activeNote.id, content: formattedContent, title: activeNote.title }));
                scheduleNoteSave({ id: activeNote.id, content: formattedContent, title: activeNote.title });
            }
        } else {
            if (editorRef.current) {
                editorRef.current.innerHTML = '';
            }
        }
    }, [activeNoteId, activeNote, dispatch, flushPendingSave, scheduleNoteSave]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        if (!activeNote) return;

        dispatch(updateNoteTitle({ id: activeNote.id, title: newTitle }));
        const currentContent = editorRef.current?.innerHTML || activeNote.content || '';
        scheduleNoteSave({ id: activeNote.id, content: sanitizeNoteHtml(currentContent), title: newTitle });
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

    // --- Selection Helpers for Dropdowns & Color Pickers ---
    const saveSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
            savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
        }
    };

    const restoreSelection = () => {
        const selection = window.getSelection();
        if (savedSelectionRef.current && selection) {
            selection.removeAllRanges();
            selection.addRange(savedSelectionRef.current);
        }
    };

    const applyColor = (command: 'foreColor' | 'hiliteColor', value: string) => {
        editorRef.current?.focus();
        restoreSelection();
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand(command, false, value);
        saveContent();
    };

    const applyFormatBlock = (tag: string) => {
        editorRef.current?.focus();
        restoreSelection();
        document.execCommand('formatBlock', false, `<${tag}>`);
        saveContent();
    };

    const applyFontSize = (size: string) => {
        editorRef.current?.focus();
        restoreSelection();
        // Force standard <font> tags behind the scenes for 100% browser compatibility
        document.execCommand('styleWithCSS', false, 'false');
        document.execCommand('fontSize', false, '7');
        if (editorRef.current) {
            const fontElements = editorRef.current.querySelectorAll('font[size="7"]');
            fontElements.forEach(font => {
                const span = document.createElement('span');
                span.style.fontSize = size;
                while (font.childNodes.length > 0) {
                    span.appendChild(font.childNodes[0]);
                }
                font.parentNode?.replaceChild(span, font);
            });
        }
        saveContent();
    };

    // Helper to wrap selected text in a custom HTML tag (like <code>)
    const wrapSelectionWithHtml = (tag: string) => {
        editorRef.current?.focus();
        restoreSelection();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        if (range.collapsed) return;
        const element = document.createElement(tag);
        element.appendChild(range.extractContents());
        range.insertNode(element);
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(element);
        selection.addRange(newRange);
        saveContent();
    };

    const findLinkFromNode = (node: Node | null | undefined) => {
        const element = node instanceof Element ? node : node?.parentElement;
        return element?.closest('a') as HTMLAnchorElement | null;
    };

    const findImageFromRange = (range: Range | null) => {
        if (!range) return null;
        const nodes = [range.startContainer, range.endContainer, range.commonAncestorContainer];
        for (const node of nodes) {
            if (node instanceof HTMLImageElement) return node;
            if (node.parentElement instanceof HTMLImageElement) return node.parentElement;
        }
        if (range.startContainer instanceof Element) {
            const selectedNode = range.startContainer.childNodes[range.startOffset];
            if (selectedNode instanceof HTMLImageElement) return selectedNode;
        }
        return null;
    };

    const handleLinkMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        const anchor = findLinkFromNode(range?.startContainer)
            || findLinkFromNode(range?.endContainer)
            || findLinkFromNode(range?.commonAncestorContainer);
        const image = findImageFromRange(range);
        linkSelectionRef.current = range ? range.cloneRange() : null;
        linkElementRef.current = anchor ?? null;
        imageElementRef.current = image;
        setIsEditingLink(Boolean(anchor));
        setLinkUrl(anchor?.getAttribute('href') || '');
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

        if (linkElementRef.current) {
            linkElementRef.current.href = parsedUrl.href;
            linkElementRef.current.target = '_blank';
            linkElementRef.current.rel = 'noopener noreferrer';
        } else if (imageElementRef.current) {
            const image = imageElementRef.current;
            const imageLink = document.createElement('a');
            imageLink.href = parsedUrl.href;
            imageLink.target = '_blank';
            imageLink.rel = 'noopener noreferrer';
            image.replaceWith(imageLink);
            imageLink.appendChild(image);
        } else if (!savedRange || savedRange.collapsed) {
            document.execCommand('insertHTML', false, `<a href="${parsedUrl.href}" target="_blank" rel="noopener noreferrer">${escapeHtml(parsedUrl.href)}</a>`);
        } else {
            document.execCommand('createLink', false, parsedUrl.href);
        }

        editorRef.current?.focus();
        saveContent();
        linkSelectionRef.current = null;
        linkElementRef.current = null;
        imageElementRef.current = null;
        setLinkUrl('');
        setIsEditingLink(false);
        setIsLinkDialogOpen(false);
    };

    const handleRemoveLink = () => {
        const anchor = linkElementRef.current;
        if (anchor) {
            anchor.replaceWith(...Array.from(anchor.childNodes));
        } else {
            const selection = window.getSelection();
            const savedRange = linkSelectionRef.current;
            if (savedRange) {
                selection?.removeAllRanges();
                selection?.addRange(savedRange);
            }
            document.execCommand('unlink');
        }

        editorRef.current?.focus();
        saveContent();
        linkSelectionRef.current = null;
        linkElementRef.current = null;
        imageElementRef.current = null;
        setLinkUrl('');
        setIsEditingLink(false);
        setIsLinkDialogOpen(false);
    };

    const handleImageMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const selection = window.getSelection();
        imageSelectionRef.current = selection && selection.rangeCount
            ? selection.getRangeAt(0).cloneRange()
            : null;
        fileInputRef.current?.click();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const base64Image = reader.result as string;
            const imgHtml = `<img src="${base64Image}" style="max-width: 100%; border-radius: 8px; margin: 16px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08);" />`;
            const selection = window.getSelection();
            const savedRange = imageSelectionRef.current;
            if (savedRange) {
                selection?.removeAllRanges();
                selection?.addRange(savedRange);
            }
            document.execCommand('insertHTML', false, imgHtml);
            saveContent();
            imageSelectionRef.current = null;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // Auto-detect pasted links & pasted images
    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        const imageItem = Array.from(e.clipboardData.items).find(item => item.type.startsWith('image/'));
        if (imageItem) {
            e.preventDefault();
            const imageFile = imageItem.getAsFile();
            if (!imageFile) return;

            const selection = window.getSelection();
            savedSelectionRef.current = selection && selection.rangeCount
                ? selection.getRangeAt(0).cloneRange()
                : null;

            const reader = new FileReader();
            reader.onload = () => {
                editorRef.current?.focus();
                const savedSelection = savedSelectionRef.current;
                if (savedSelection) {
                    selection?.removeAllRanges();
                    selection?.addRange(savedSelection);
                }

                const image = `<img src="${reader.result as string}" alt="Pasted image" style="max-width: 100%; border-radius: 8px; margin: 16px 0;" />`;
                document.execCommand('insertHTML', false, sanitizeNoteHtml(image));
                saveContent();
                savedSelectionRef.current = null;
            };
            reader.readAsDataURL(imageFile);
            return;
        }

        const text = e.clipboardData.getData('text/plain');
        const html = e.clipboardData.getData('text/html');
        e.preventDefault();

        if (/([#*_~\[\]\(\)])/.test(text) && !html) {
            document.execCommand('insertHTML', false, sanitizeNoteHtml(markdownToHtml(text)));
        } else if (html) {
            document.execCommand('insertHTML', false, sanitizeNoteHtml(html));
        } else {
            // Auto-link plain text URLs
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const escapedText = escapeHtml(text);
            const linkedText = escapedText.replace(urlRegex, (url) => 
                `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
            );
            document.execCommand('insertHTML', false, linkedText);
        }
        saveContent();
    };

    const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const link = (e.target as HTMLElement).closest('a');
        if (link) {
            e.preventDefault();
            window.open(link.href, '_blank', 'noopener,noreferrer');
        }
    };

    const saveContent = (saveImmediately = false) => {
        if (!editorRef.current || !activeNote) return;
        const content = sanitizeNoteHtml(editorRef.current.innerHTML);
        const currentTitle = activeNote.title || 'Untitled Note';

        dispatch(updateNote({ id: activeNote.id, content, title: currentTitle }));
        scheduleNoteSave({ id: activeNote.id, content, title: currentTitle });
        if (saveImmediately) flushPendingSave();
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
                .editor-scroll::-webkit-scrollbar { width: 5px; }
                .editor-scroll::-webkit-scrollbar-track { background: transparent; }
                .editor-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
                .editor-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
                .note-content code { background: #f1f5f9; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.875rem; }
                .note-content h1 { font-size: 2rem; font-weight: 800; margin: 1rem 0; }
                .note-content h2 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0; }
                .note-content h3 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0; }
                .note-content blockquote { border-left: 4px solid #d1d5db; padding-left: 1rem; color: #6b7280; font-style: italic; margin: 1rem 0; }
            `}</style>

            <div className="flex flex-col w-full h-full bg-background overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-card/90 backdrop-blur-xs shrink-0">
                    <div className="flex flex-wrap items-center gap-0.5">
                        
                        {/* Text Style Dropdown */}
                        <select
                            value={activeFormats.formatBlock || 'p'}
                            onMouseDown={saveSelection}
                            onChange={(e) => applyFormatBlock(e.target.value)}
                            className="h-8 mr-1 px-2 text-sm border border-border rounded-md bg-card text-foreground outline-none cursor-pointer"
                            title="Text style"
                        >
                            <option value="p">Normal</option>
                            <option value="h1">Heading 1</option>
                            <option value="h2">Heading 2</option>
                            <option value="h3">Heading 3</option>
                            <option value="blockquote">Quote</option>
                        </select>

                        {/* Font Size Dropdown */}
                        <select
                            value={activeFormats.fontSize || ''}
                            onMouseDown={saveSelection}
                            onChange={(e) => applyFontSize(e.target.value)}
                            className="h-8 mr-1 px-2 text-sm border border-border rounded-md bg-card text-foreground outline-none cursor-pointer"
                            title="Font size"
                        >
                            <option value="" disabled>Size</option>
                            <option value="12px">12</option>
                            <option value="14px">14</option>
                            <option value="16px">16</option>
                            <option value="18px">18</option>
                            <option value="24px">24</option>
                            <option value="32px">32</option>
                            {/* Display current size if it doesn't match default options */}
                            {activeFormats.fontSize && !['12px', '14px', '16px', '18px', '24px', '32px'].includes(activeFormats.fontSize) && (
                                <option value={activeFormats.fontSize}>
                                    {activeFormats.fontSize.replace('px', '')}
                                </option>
                            )}
                        </select>

                        <ToolbarButton onMouseDown={(e) => handleToolbarMouseDown(e, 'bold')} title="Bold (Ctrl+B)" active={activeFormats.bold}>
                            <Bold size={16} strokeWidth={2.5} />
                        </ToolbarButton>
                        <ToolbarButton onMouseDown={(e) => handleToolbarMouseDown(e, 'italic')} title="Italic (Ctrl+I)" active={activeFormats.italic}>
                            <Italic size={16} strokeWidth={2.5} />
                        </ToolbarButton>
                        <ToolbarButton onMouseDown={(e) => handleToolbarMouseDown(e, 'underline')} title="Underline (Ctrl+U)" active={activeFormats.underline}>
                            <Underline size={16} strokeWidth={2.5} />
                        </ToolbarButton>
                        <ToolbarButton onMouseDown={(e) => handleToolbarMouseDown(e, 'strikeThrough')} title="Strikethrough" active={activeFormats.strikeThrough}>
                            <Strikethrough size={16} strokeWidth={2.5} />
                        </ToolbarButton>
                        <ToolbarButton onMouseDown={(e) => { e.preventDefault(); wrapSelectionWithHtml('code'); }} title="Inline Code">
                            <Code size={16} strokeWidth={2.5} />
                        </ToolbarButton>

                        <ToolbarDivider />

                        {/* Text Color */}
                        <div className="relative flex items-center justify-center w-8 h-8 hover:bg-accent rounded-lg transition-all cursor-pointer" title="Text color">
                            <Palette size={16} className="absolute pointer-events-none text-muted-foreground" />
                            <input
                                type="color"
                                value={activeFormats.foreColor || '#000000'}
                                onMouseDown={saveSelection}
                                onChange={(e) => applyColor('foreColor', e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>

                        {/* Highlight Color */}
                        <div className="relative flex items-center justify-center w-8 h-8 hover:bg-accent rounded-lg transition-all cursor-pointer" title="Highlight color">
                            <Highlighter size={16} className="absolute pointer-events-none text-muted-foreground" />
                            <input
                                type="color"
                                value={activeFormats.hiliteColor || '#ffff00'}
                                onMouseDown={saveSelection}
                                onChange={(e) => applyColor('hiliteColor', e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>

                        <ToolbarDivider />

                        <ToolbarButton onMouseDown={handleLinkMouseDown} title="Insert link">
                            <Link size={16} strokeWidth={2.5} />
                        </ToolbarButton>

                        <ToolbarDivider />

                        <ToolbarButton onMouseDown={(e) => handleToolbarMouseDown(e, 'justifyLeft')} title="Align left" active={activeFormats.justifyLeft}>
                            <AlignLeft size={16} strokeWidth={2.5} />
                        </ToolbarButton>
                        <ToolbarButton onMouseDown={(e) => handleToolbarMouseDown(e, 'justifyCenter')} title="Align center" active={activeFormats.justifyCenter}>
                            <AlignCenter size={16} strokeWidth={2.5} />
                        </ToolbarButton>
                        <ToolbarButton onMouseDown={(e) => handleToolbarMouseDown(e, 'justifyRight')} title="Align right" active={activeFormats.justifyRight}>
                            <AlignRight size={16} strokeWidth={2.5} />
                        </ToolbarButton>
                        <ToolbarButton onMouseDown={(e) => handleToolbarMouseDown(e, 'justifyFull')} title="Justify" active={activeFormats.justifyFull}>
                            <AlignJustify size={16} strokeWidth={2.5} />
                        </ToolbarButton>

                        <ToolbarDivider />

                        <ToolbarButton onMouseDown={(e) => handleToolbarMouseDown(e, 'insertUnorderedList')} title="Bullet list" active={activeFormats.insertUnorderedList}>
                            <List size={16} strokeWidth={2.5} />
                        </ToolbarButton>
                        <ToolbarButton onMouseDown={(e) => handleToolbarMouseDown(e, 'insertOrderedList')} title="Numbered list" active={activeFormats.insertOrderedList}>
                            <ListOrdered size={16} strokeWidth={2.5} />
                        </ToolbarButton>

                        <ToolbarDivider />

                        <ToolbarButton onMouseDown={(e) => handleToolbarMouseDown(e, 'insertHorizontalRule')} title="Divider">
                            <Minus size={16} strokeWidth={2.5} />
                        </ToolbarButton>
                        <ToolbarButton onMouseDown={handleImageMouseDown} title="Insert image" className="hover:text-blue-600">
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
                            onInput={() => saveContent()}
                            onBlur={() => saveContent(true)}
                            className="note-content flex-1 outline-none bg-background dark:bg-black text-foreground leading-relaxed text-base selection:bg-blue-100 dark:selection:bg-blue-700 dark:selection:text-white min-h-100"
                            data-placeholder="Start typing your note here..."
                        />
                    </div>
                </div>
            </div>

            {isLinkDialogOpen && (
                <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/30 px-4 backdrop-blur-xs">
                    <form onSubmit={handleLinkSubmit} className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
                        <div className="mb-4">
                            <h2 className="text-base font-semibold text-foreground">{isEditingLink ? 'Edit link' : 'Add link'}</h2>
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
                        <div className="mt-5 flex items-center justify-between gap-2">
                            {isEditingLink ? (
                                <button
                                    type="button"
                                    onClick={handleRemoveLink}
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                                >
                                    <Link2Off size={15} />
                                    <span>Remove link</span>
                                </button>
                            ) : <span />}
                            <div className="flex gap-2">
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
                                    {isEditingLink ? 'Save changes' : 'Add link'}
                                </button>
                            </div>
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