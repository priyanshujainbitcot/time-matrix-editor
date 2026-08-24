'use client';

import { useCallback, useState } from 'react';
import { Plus, X } from 'lucide-react';
import TaskList from '@/components/domain/TaskList';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addTask } from '@/store/slices/tasksSlice';
import { createTask } from '@/services/databaseService';
import Toast, { ToastType } from '@/components/ui/Toast';

const MAX_TITLE_LENGTH = 120;

export default function ShowTasksPage() {
    const dispatch = useAppDispatch();
    const tasks = useAppSelector((state) => state.tasks.items);
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newQuadrant, setNewQuadrant] = useState<1 | 2 | 3 | 4>(1);
    const [toast, setToast] = useState<{ type: ToastType; message: string; visible: boolean }>({
        type: 'error',
        message: '',
        visible: false,
    });

    const showToast = useCallback((type: ToastType, message: string) => {
        setToast({ type, message, visible: true });
    }, []);

    const handleToastDone = useCallback(() => {
        setToast(prev => ({ ...prev, visible: false }));
    }, []);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        try {
            const newTask = await createTask(newTitle.trim(), newQuadrant);
            dispatch(addTask(newTask));
            setNewTitle('');
            setIsAdding(false);
        } catch (error) {
            console.error('Failed to create task:', error);
            showToast('error', 'Could not create task');
        }
    };

    const remaining = MAX_TITLE_LENGTH - newTitle.length;

    return (
        <div className="flex-1 w-full h-full overflow-y-auto bg-background py-8 px-6">
            <div className="max-w-5xl mx-auto flex flex-col">

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">All Tasks</h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage tasks and statuses across all quadrants.</p>
                    </div>
                    {!isAdding && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                        >
                            <Plus size={16} strokeWidth={2.5} />
                            <span>Add Task</span>
                        </button>
                    )}
                </div>


                {isAdding && (
                    <form onSubmit={handleCreateTask} className="mb-6 p-4 bg-card border border-blue-200 rounded-xl shadow-xs">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex-1 min-w-55 relative">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => {
                                        if (e.target.value.length <= MAX_TITLE_LENGTH) {
                                            setNewTitle(e.target.value);
                                        }
                                    }}
                                    placeholder="Enter task title..."
                                    maxLength={MAX_TITLE_LENGTH}
                                    className="w-full text-sm bg-background text-foreground px-3 py-2 rounded-lg border border-border outline-none focus:bg-background focus:ring-2 focus:ring-blue-100 focus:border-blue-300 pr-14"
                                />
                                <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium tabular-nums ${remaining <= 15 ? 'text-red-500' : remaining <= 30 ? 'text-amber-500' : 'text-muted-foreground'
                                    }`}>
                                    {remaining}
                                </span>
                            </div>

                            <select
                                value={newQuadrant}
                                onChange={(e) => setNewQuadrant(Number(e.target.value) as 1 | 2 | 3 | 4)}
                                className="text-xs font-medium bg-background text-foreground border border-border rounded-lg px-3 py-2 outline-none cursor-pointer"
                            >
                                <option className="bg-background text-foreground" value={1}>P1 · Do First (Urgent & Important)</option>
                                <option className="bg-background text-foreground" value={2}>P2 · Schedule (Not Urgent & Important)</option>
                                <option className="bg-background text-foreground" value={3}>P3 · Delegate (Urgent & Not Important)</option>
                                <option className="bg-background text-foreground" value={4}>P4 · Eliminate (Not Urgent & Not Important)</option>
                            </select>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="submit"
                                    disabled={!newTitle.trim()}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                                >
                                    Add
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsAdding(false); setNewTitle(''); }}
                                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer"
                                    title="Cancel"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    </form>
                )}


                <TaskList tasks={tasks} />
            </div>
            <Toast
                type={toast.type}
                message={toast.message}
                visible={toast.visible}
                onDone={handleToastDone}
            />
        </div>
    );
}