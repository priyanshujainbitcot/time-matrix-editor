'use client';

import { User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setView, type AppView } from '@/store/slices/navigationSlice';

export default function Header() {
    const dispatch = useAppDispatch();
    const currentView = useAppSelector((state) => state.navigation.currentView);

    const navItems: Array<{ label: string; view: AppView }> = [
        { label: 'DEFAULT', view: 'default' },
        { label: 'MATRIX', view: 'matrix' },
        { label: 'TASKS', view: 'tasks' },
        { label: 'NOTES', view: 'notes' },
    ];

    const handleNavClick = (view: AppView) => {
        dispatch(setView(view));
    };

    return (
        <header className="flex items-center justify-between px-8 py-4 bg-card border-b border-border sticky top-0 z-50 shadow-sm">

            <div 
                className="text-2xl font-extrabold tracking-tight text-foreground cursor-pointer"
                onClick={() => handleNavClick('default')}
            >
                <span className="text-blue-600">T</span><span className="text-blue-600">N</span>Matrix
            </div>

            <nav className="flex space-x-12">
                {navItems.map((item) => {
                    const isActive = currentView === item.view;

                    return (
                        <button
                            key={item.view}
                            onClick={() => handleNavClick(item.view)}
                            className={`text-sm font-semibold tracking-wide pb-1 transition-colors border-b-2 ${isActive
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40'
                                }`}
                        >
                            {item.label}
                        </button>
                    );
                })}
            </nav>


            <div className="flex items-center gap-2">
                <ThemeToggle />
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted text-muted-foreground overflow-hidden cursor-pointer hover:bg-accent transition-colors border border-border">
                    <User size={20} />
                </div>
            </div>
        </header>
    );
}