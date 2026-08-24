'use client';

import { useState } from 'react';
import MatrixQuadrant from '@/components/domain/MatrixQuadrant';

export default function ShowMatixPage() {
    const [activeAddingQuadrant, setActiveAddingQuadrant] = useState<1 | 2 | 3 | 4 | null>(null);

    const quadrants = [
        {
            number: 1 as const,
            title: 'NECESSITY',
            actionSubtitle: 'Urgent & Important · Do First',
        },
        {
            number: 2 as const,
            title: 'EFFECTIVENESS',
            actionSubtitle: 'Not Urgent & Important · Schedule',
           
        },
        {
            number: 3 as const,
            title: 'DISTRACTION',
            actionSubtitle: 'Urgent & Not Important · Delegate',
           
        },
        {
            number: 4 as const,
            title: 'WASTE',
            actionSubtitle: 'Not Urgent & Not Important · Eliminate',
        
        },
    ];

    return (
        <div className="flex-1 w-full h-full overflow-y-auto bg-slate-50 py-8 px-4 sm:px-6 flex justify-center items-start">
            <div className="w-full max-w-5xl flex flex-col min-h-145">

                {/* Top Column Labels (Urgent / Not Urgent) */}
                <div className="grid grid-cols-2 pl-12 mb-3 text-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Urgent
                    </span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Not Urgent
                    </span>
                </div>

                <div className="flex grow w-full">
                    {/* Left Side Row Labels (Important / Not Important) */}
                    <div className="grid grid-rows-2 gap-3.5 w-10 shrink-0 mr-2">
                        <div className="flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 select-none whitespace-nowrap">
                                Important
                            </span>
                        </div>
                        <div className="flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 select-none whitespace-nowrap">
                                Not Important
                            </span>
                        </div>
                    </div>

                    {/* 2x2 Matrix Quadrants */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 grid-rows-2 gap-3.5 grow h-[calc(100vh-11rem)] min-h-130">
                        {quadrants.map((q) => (
                            <MatrixQuadrant
                                key={q.number}
                                quadrantNumber={q.number}
                                title={q.title}
                                actionSubtitle={q.actionSubtitle}
                                isAdding={activeAddingQuadrant === q.number}
                                onStartAdding={() => setActiveAddingQuadrant(q.number)}
                                onCancelAdding={() => setActiveAddingQuadrant(null)}
                            />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}