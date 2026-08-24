'use client';

import { RotateCcw } from 'lucide-react';

export default function UndoBadge({ count, onClick }: { count: number; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="fixed right-4 bottom-4 z-40 flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-lg hover:bg-gray-800 transition-all hover:scale-105 cursor-pointer"
        >
            <RotateCcw size={14} />
            <span>{count} deleted</span>
            <span className="w-5 h-5 flex items-center justify-center bg-white/20 rounded-full text-[10px] font-bold">{count}</span>
        </button>
    );
}