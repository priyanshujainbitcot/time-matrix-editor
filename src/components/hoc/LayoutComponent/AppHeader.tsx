'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
    const pathname = usePathname();

    const navItems = [
        { label: 'MATRIX', path: '/matrix' },
        { label: 'TASKS', path: '/tasks' },
        { label: 'NOTES', path: '/notes' },
    ];

    return (
        <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">

            <div className="text-2xl font-extrabold tracking-tight text-foreground">
                <Link href="/notes"><span className="text-blue-600">T</span><span className="text-blue-600">N</span>Matrix</Link>
            </div>

            <nav className="flex space-x-12">
                {navItems.map((item) => {

                    const isActive = pathname?.startsWith(item.path);

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`text-sm font-semibold tracking-wide pb-1 transition-colors border-b-2 ${isActive
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                                }`}
                        >
                            {item.label}
                        </Link>
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