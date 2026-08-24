'use client';

import { X, AlertTriangle, Check } from 'lucide-react';
import { DeletedTaskItem } from '@/store/slices/tasksSlice';
import DeletedTaskCard from './DeletedTaskCard';

interface UndoPanelProps {
    isOpen: boolean;
    onClose: () => void;
    items: DeletedTaskItem[];
    onRestore: (item: DeletedTaskItem) => void;
    onDismiss: (id: string) => void;
    onClearAll: () => void;
}

export default function UndoPanel({ isOpen, onClose, items, onRestore, onDismiss, onClearAll }: UndoPanelProps) {
    return (
        <>
            <div className={`fixed top-0 right-0 h-full w-80 bg-white border-l border-gray-200 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/80">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><AlertTriangle size={16} className="text-amber-500" /></div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800">Deleted Tasks</h3>
                                <p className="text-[11px] text-gray-400">Restore or permanently delete tasks</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"><X size={16} /></button>
                    </div>
                </div>

                <div className="deleted-tasks-scroll overflow-y-auto h-[calc(100%-73px)] p-4 space-y-3">
                    {items.length > 1 && (
                        <div className="flex justify-end">
                            <button onClick={onClearAll} className="border border-gray-200 bg-white px-2.5 py-1 text-[11px] text-gray-500 hover:text-red-500 transition-colors cursor-pointer" title="Dismiss all">Clear all</button>
                        </div>
                    )}
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Check size={32} className="mb-3 text-emerald-300" />
                            <p className="text-sm">No deleted tasks</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <DeletedTaskCard key={item.task.id} item={item} onRestore={onRestore} onDismiss={onDismiss} />
                        ))
                    )}
                </div>
            </div>

            {isOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 lg:hidden" onClick={onClose} />}
        </>
    );
}