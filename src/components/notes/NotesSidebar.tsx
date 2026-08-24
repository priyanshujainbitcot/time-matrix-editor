'use client';

import { FileDown, FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import type { NoteEntity } from '@/services/databaseService';

interface NotesSidebarProps {
    notes: NoteEntity[];
    activeNoteId: string | null;
    isExporting: boolean;
    onSelectNote: (id: string) => void;
    onCreateNote: () => void;
    onExportNote: () => void;
    onDeleteNote: (id: string, title: string, event: React.MouseEvent) => void;
    formatNoteDate: (timestamp: number) => string;
}

export default function NotesSidebar({
    notes,
    activeNoteId,
    isExporting,
    onSelectNote,
    onCreateNote,
    onExportNote,
    onDeleteNote,
    formatNoteDate,
}: NotesSidebarProps) {
    return (
        <div className="w-80 flex flex-col bg-muted/70 border-r border-border h-full overflow-hidden shrink-0">
            <div className="flex justify-between items-center px-5 py-4 border-b border-border bg-card">
                <div>
                    <h2 className="text-sm font-bold text-foreground tracking-tight">All Notes</h2>
                    <p className="text-[11px] text-muted-foreground">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onExportNote}
                        disabled={isExporting || !activeNoteId}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-foreground bg-muted hover:bg-accent border border-border rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Export current note to PDF"
                    >
                        {isExporting ? <Loader2 size={14} strokeWidth={2.5} className="animate-spin" /> : <FileDown size={14} strokeWidth={2.5} />}
                        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
                    </button>
                    <button
                        onClick={onCreateNote}
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
                            onClick={onCreateNote}
                            className="mt-4 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        >
                            + Create Note
                        </button>
                    </li>
                ) : (
                    notes.map((note) => (
                        <li
                            key={note.id}
                            onClick={() => onSelectNote(note.id)}
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
                                    <p className="text-[11px] text-muted-foreground mt-1">{formatNoteDate(note.updatedAt)}</p>
                                </div>
                                <button
                                    onClick={(event) => onDeleteNote(note.id, note.title, event)}
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
    );
}
