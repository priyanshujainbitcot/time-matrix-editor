import type { Task } from '@/store/slices/tasksSlice';

export const getQuadrantBadge = (quadrant: 1 | 2 | 3 | 4) => {
    const styles = {
        1: 'bg-rose-50 text-rose-600 border-rose-200',
        2: 'bg-sky-50 text-sky-600 border-sky-200',
        3: 'bg-amber-50 text-amber-600 border-amber-200',
        4: 'bg-slate-50 text-slate-500 border-slate-200',
    };
    const labels = { 1: 'P1', 2: 'P2', 3: 'P3', 4: 'P4' };
    return (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${styles[quadrant]}`
        }>
            {labels[quadrant]}
        </span>
    );
};

export const getStatusStyle = (status: Task['status']) => {
    switch (status) {
        case 'done': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800';
        case 'in-progress': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800';
        default: return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700';
    }
};