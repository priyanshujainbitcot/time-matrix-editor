'use client';

import { Provider } from 'react-redux';
import { store } from '../store/store';
import TasksProvider from '@/components/providers/TasksProvider';


export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <TasksProvider>
                {children}
            </TasksProvider>
        </Provider>
    );
}