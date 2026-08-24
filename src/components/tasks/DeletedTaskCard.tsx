'use client';

import { RotateCcw, XCircle } from 'lucide-react';
import { DeletedTaskItem } from '@/store/slices/tasksSlice';
import { getQuadrantBadge, getStatusStyle } from './helpers';

interface DeletedTaskCardProps {
    item: DeletedTaskItem;
    onRestore: (item: DeletedTaskItem) => void;
    onDismiss: (id: string) => void;
}

export default function DeletedTaskCard({ item, onRestore, onDismiss }: DeletedTaskCardProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3.5">
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {getQuadrantBadge(item.task.quadrant)}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getStatusStyle(item.task.status)}`}>{item.task.status}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 line-clamp-2">{item.task.title}</p>
                    </div>
                    <button onClick={() => onDismiss(item.task.id)} className="p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded transition-colors shrink-0 cursor-pointer" title="Dismiss"><XCircle size={14} /></button>
                </div>

                <div className="text-[11px] text-gray-500 mb-3">
                    Deleted task. It will stay here until you remove it.
                </div>

                <button
                    onClick={() => onRestore(item)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-blue-100 hover:border-blue-200"
                >
                    <RotateCcw size={13} strokeWidth={2.5} />
                    <span>Restore Task</span>
                </button>
            </div>
        </div>
    );
}