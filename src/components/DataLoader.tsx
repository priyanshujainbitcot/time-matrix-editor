'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setTasks } from '@/store/slices/tasksSlice';
import { db } from '@/services/databaseService';

export default function DataLoader({ children }: { children: React.ReactNode }) {
    const dispatch = useAppDispatch();
    const isLoaded = useAppSelector((state) => state.tasks.isLoaded);

    useEffect(() => {
        const loadData = async () => {
            if (!isLoaded) {
                
                const savedTasks = await db.tasks.toArray();
                
                dispatch(setTasks(savedTasks));
            }
        };

        loadData();
    }, [dispatch, isLoaded]);

    return <>{children}</>;
}