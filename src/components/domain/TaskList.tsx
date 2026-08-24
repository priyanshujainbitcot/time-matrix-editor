'use client';

import { useState, useCallback } from 'react';
import { Task, DeletedTaskItem, updateTaskStatus, editTask, deleteTask, addTask, addToUndoStack, removeFromUndoStack, clearUndoStack } from '@/store/slices/tasksSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { db } from '@/services/databaseService';

import TaskRow from '@/components/tasks/TaskRow';
import UndoPanel from '@/components/tasks/UndoPanel';
import UndoBadge from '@/components/tasks/UndoBadge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Toast, { ToastType } from '@/components/ui/Toast';

interface TaskListProps {
    tasks: Task[];
}

export default function TaskList({ tasks }: TaskListProps) {
    const dispatch = useAppDispatch();
    const deletedTasks = useAppSelector(state => state.tasks.undoStack);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // Confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    // Toast state
    const [toast, setToast] = useState<{ type: ToastType; message: string; visible: boolean }>({
        type: 'saved',
        message: '',
        visible: false,
    });

    const showToast = useCallback((type: ToastType, message: string) => {
        setToast({ type, message, visible: true });
    }, []);

    const handleToastDone = useCallback(() => {
        setToast(prev => ({ ...prev, visible: false }));
    }, []);

    const handleStatusChange = async (id: string, newStatus: Task['status']) => {
        try {
            await db.tasks.update(id, { status: newStatus });
            dispatch(updateTaskStatus({ id, status: newStatus }));
        } catch (error) {
            console.error('Failed to update task status:', error);
            showToast('error', 'Could not update task');
        }
    };

    const handleStartEdit = (id: string, currentTitle: string) => {
        setEditingId(id);
        setEditingTitle(currentTitle);
    };

    const handleConfirmEdit = async () => {
        if (editingId && editingTitle.trim()) {
            try {
                await db.tasks.update(editingId, { title: editingTitle.trim() });
                dispatch(editTask({ id: editingId, title: editingTitle.trim() }));
                showToast('saved', 'Task updated');
            } catch (error) {
                console.error('Failed to update task:', error);
                showToast('error', 'Could not update task');
            }
        }
        setEditingId(null);
        setEditingTitle('');
    };

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleConfirmEdit();
        if (e.key === 'Escape') { setEditingId(null); setEditingTitle(''); }
    };

    const handleDeleteClick = (id: string) => {
        setPendingDeleteId(id);
        setConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!pendingDeleteId) return;
        const taskToDelete = tasks.find(t => t.id === pendingDeleteId);
        if (!taskToDelete) return;

        const deletedAt = Date.now();
        try {
            await db.transaction('rw', db.tasks, db.deletedTasks, async () => {
                await db.deletedTasks.add({ taskId: taskToDelete.id, task: taskToDelete, deletedAt });
                await db.tasks.delete(pendingDeleteId);
            });
            dispatch(addToUndoStack({ task: taskToDelete, deletedAt }));
            dispatch(deleteTask(pendingDeleteId));
        } catch (error) {
            console.error('Failed to delete task:', error);
            showToast('error', 'Could not delete task');
            return;
        }

        setConfirmOpen(false);
        setPendingDeleteId(null);
        setIsPanelOpen(true);
        showToast('deleted', 'Task deleted');
    };

    const handleDeleteCancel = () => {
        setConfirmOpen(false);
        setPendingDeleteId(null);
    };

    const handleRestore = async (deletedItem: DeletedTaskItem) => {
        const { task } = deletedItem;
        const restoredTask = {
            id: task.id,
            title: task.title,
            quadrant: task.quadrant,
            status: task.status,
            createdAt: task.createdAt ?? Date.now()
        };
        try {
            await db.transaction('rw', db.tasks, db.deletedTasks, async () => {
                await db.tasks.add(restoredTask);
                await db.deletedTasks.delete(task.id);
            });
            dispatch(addTask(restoredTask));
            dispatch(removeFromUndoStack(task.id));
            showToast('restored', 'Task restored');
        } catch (error) {
            console.error('Failed to restore task:', error);
            showToast('error', 'Could not restore task');
        }
    };

    const handleDismiss = async (id: string) => {
        try {
            await db.deletedTasks.delete(id);
            dispatch(removeFromUndoStack(id));
        } catch (error) {
            console.error('Failed to dismiss deleted task:', error);
            showToast('error', 'Could not remove deleted task');
        }
    };

    const handleClearAll = async () => {
        const taskIds = deletedTasks.map(d => d.task.id);
        try {
            await db.deletedTasks.bulkDelete(taskIds);
            dispatch(clearUndoStack());
            setIsPanelOpen(false);
        } catch (error) {
            console.error('Failed to clear deleted tasks:', error);
            showToast('error', 'Could not clear deleted tasks');
        }
    };

    return (
        <div className="relative w-full">
            <div className="w-full bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="grid grid-cols-[minmax(0,1fr)_120px_120px_90px] gap-4 px-5 py-3 border-b border-border bg-muted text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <div>Task</div>
                    <div className="text-center">Quadrant</div>
                    <div className="text-center">Status</div>
                    <div className="text-center">Actions</div>
                </div>

                <ul className="divide-y divide-gray-100/80">
                    {tasks.length === 0 && deletedTasks.length === 0 ? (
                        <li className="px-5 py-10 text-center text-muted-foreground text-sm">No tasks yet. Add some from the Matrix!</li>
                    ) : tasks.length === 0 ? (
                        <li className="px-5 py-10 text-center text-muted-foreground text-sm">All tasks deleted. Check the recovery panel →</li>
                    ) : (
                        tasks.map((task) => (
                            <TaskRow
                                key={task.id}
                                task={task}
                                isEditing={editingId === task.id}
                                editValue={editingTitle}
                                onEditChange={setEditingTitle}
                                onStartEdit={handleStartEdit}
                                onSave={handleConfirmEdit}
                                onCancel={() => { setEditingId(null); setEditingTitle(''); }}
                                onKeyDown={handleEditKeyDown}
                                onStatusChange={handleStatusChange}
                                onDelete={handleDeleteClick}
                            />
                        ))
                    )}
                </ul>
            </div>

            {deletedTasks.length > 0 && !isPanelOpen && (
                <UndoBadge count={deletedTasks.length} onClick={() => setIsPanelOpen(true)} />
            )}

            <UndoPanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                items={deletedTasks}
                onRestore={handleRestore}
                onDismiss={handleDismiss}
                onClearAll={handleClearAll}
            />

            <ConfirmDialog
                open={confirmOpen}
                title="Delete task?"
                message="This task will be moved to the recovery panel until you permanently delete it."
                confirmLabel="Delete"
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