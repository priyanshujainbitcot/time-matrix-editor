'use client';

import { useEffect } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';

export type ToastType = 'saved' | 'deleted' | 'restored' | 'success' | 'error';

interface ToastProps {
    type: ToastType;
    message: string;
    visible: boolean;
    onDone: () => void;
}

const config: Record<ToastType, { icon: React.ReactNode; bg: string; border: string }> = {
    saved: {
        icon: <Check size={14} strokeWidth={2.5} />,
        bg: 'bg-emerald-50 dark:bg-emerald-950/70',
        border: 'border-emerald-200 dark:border-emerald-800',
    },
    deleted: {
        icon: <Trash2 size={14} strokeWidth={2.5} />,
        bg: 'bg-red-50 dark:bg-red-950/70',
        border: 'border-red-200 dark:border-red-800',
    },
    restored: {
        icon: <Pencil size={14} strokeWidth={2.5} />,
        bg: 'bg-blue-50 dark:bg-blue-950/70',
        border: 'border-blue-200 dark:border-blue-800',
    },
    success: {
        icon: <Check size={14} strokeWidth={2.5} />,
        bg: 'bg-emerald-50 dark:bg-emerald-950/70',
        border: 'border-emerald-200 dark:border-emerald-800',
    },
    error: {
        icon: <X size={14} strokeWidth={2.5} />,
        bg: 'bg-red-50 dark:bg-red-950/70',
        border: 'border-red-200 dark:border-red-800',
    },
};

export default function Toast({ type, message, visible, onDone }: ToastProps) {
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                onDone();
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [visible, onDone]);

    if (!visible) return null;

    const c = config[type];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-100">
            <div
                className={`flex items-center gap-2.5 px-4 py-2.5 ${c.bg} border ${c.border} rounded-xl shadow-lg opacity-100 translate-y-0 transition-all duration-200`}
            >
                <span className={type === 'saved' || type === 'success' ? 'text-emerald-600 dark:text-emerald-300' : type === 'deleted' || type === 'error' ? 'text-red-600 dark:text-red-300' : 'text-blue-600 dark:text-blue-300'}>
                    {c.icon}
                </span>
                <span className="text-sm font-medium text-foreground">{message}</span>
                <button
                    onClick={onDone}
                    className="ml-1 p-0.5 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                >
                    <X size={12} />
                </button>
            </div>
        </div>
    );
}