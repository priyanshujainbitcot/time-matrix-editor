'use client';

import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Task } from '@/store/slices/tasksSlice';
import { getQuadrantBadge, getStatusStyle } from './helpers';

const MAX_TITLE_LENGTH = 120;

interface TaskRowProps {
    task: Task;
    isEditing: boolean;
    editValue: string;
    onEditChange: (val: string) => void;
    onStartEdit: (id: string, title: string) => void;
    onSave: () => void;
    onCancel: () => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onStatusChange: (id: string, status: Task['status']) => void;
    onDelete: (id: string) => void;
}

export default function TaskRow({
    task, isEditing, editValue, onEditChange, onStartEdit,
    onSave, onCancel, onKeyDown, onStatusChange, onDelete
}: TaskRowProps) {
    const remaining = MAX_TITLE_LENGTH - editValue.length;

    return (
        <li className="grid grid-cols-[minmax(0,1fr)_120px_120px_90px] gap-4 items-center px-5 py-3 hover:bg-accent transition-colors group">
            <div className="flex items-center gap-3 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.status === 'done' ? 'bg-emerald-400' : task.status === 'in-progress' ? 'bg-amber-400' : 'bg-gray-300'}`} />
                {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div className="relative flex-1 min-w-0">
                            <input
                                autoFocus
                                type="text"
                                value={editValue}
                                onChange={(e) => {
                                    if (e.target.value.length <= MAX_TITLE_LENGTH) {
                                        onEditChange(e.target.value);
                                    }
                                }}
                                onKeyDown={onKeyDown}
                                maxLength={MAX_TITLE_LENGTH}
                                className="w-full text-sm bg-background text-foreground px-2.5 py-1 pr-10 rounded-md border border-blue-300 outline-none focus:ring-2 focus:ring-blue-100 min-w-0"
                            />
                            <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium tabular-nums ${
                                remaining <= 15 ? 'text-red-500' : remaining <= 30 ? 'text-amber-500' : 'text-muted-foreground'
                            }`}>
                                {remaining}
                            </span>
                        </div>
                        <button onClick={onSave} className="p-1 text-green-600 hover:bg-green-50 rounded cursor-pointer" title="Save"><Check size={14} strokeWidth={2.5} /></button>
                        <button onClick={onCancel} className="p-1 text-muted-foreground hover:bg-accent rounded cursor-pointer" title="Cancel"><X size={14} strokeWidth={2.5} /></button>
                    </div>
                ) : (
                    <span className={`text-sm font-medium truncate ${task.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.title}</span>
                )}
            </div>

            <div className="flex items-center justify-center">
                {getQuadrantBadge(task.quadrant)}
            </div>

            <div className="flex justify-center">
                <select
                    value={task.status}
                    onChange={(e) => onStatusChange(task.id, e.target.value as Task['status'])}
                    className={`text-[11px] font-semibold rounded-md px-2.5 py-1.5 outline-none border cursor-pointer transition-colors ${getStatusStyle(task.status)}`}
                >
                    <option className="bg-background text-foreground" value="pending">Pending</option>
                    <option className="bg-background text-foreground" value="in-progress">In Progress</option>
                    <option className="bg-background text-foreground" value="done">Done</option>
                </select>
            </div>

            <div className="flex items-center justify-center gap-1 opacity-100">
                {!isEditing && (
                    <>
                        <button onClick={() => onStartEdit(task.id, task.title)} className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-accent rounded-md transition-colors cursor-pointer" title="Edit task"><Pencil size={14} /></button>
                        <button onClick={() => onDelete(task.id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-accent rounded-md transition-colors cursor-pointer" title="Delete task"><Trash2 size={14} /></button>
                    </>
                )}
            </div>
        </li>
    );
}