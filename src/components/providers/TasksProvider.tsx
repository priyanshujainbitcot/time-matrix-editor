'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setTasks, setDeletedTasks } from '@/store/slices/tasksSlice';
import { db } from '@/services/databaseService';

export default function TasksProvider({ children }: { children: React.ReactNode }) {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const loadData = async () => {
            const tasks = await db.tasks.toArray();
            const deletedItems = await db.deletedTasks.toArray();
            dispatch(setTasks(tasks));
            dispatch(setDeletedTasks(
                deletedItems.map(d => ({ task: d.task, deletedAt: d.deletedAt }))
            ));
        };
        loadData();
    }, [dispatch]);

    return <>{children}</>;
}