'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

const themeListeners = new Set<() => void>();

const subscribeToTheme = (listener: () => void) => {
    themeListeners.add(listener);
    return () => themeListeners.delete(listener);
};

const getThemeSnapshot = () => document.documentElement.classList.contains('dark');
const getServerThemeSnapshot = () => true;

export default function ThemeToggle() {
    const isDark = useSyncExternalStore(
        subscribeToTheme,
        getThemeSnapshot,
        getServerThemeSnapshot,
    );

    useEffect(() => {
        const savedTheme = window.localStorage.getItem('theme');
        const shouldUseDark = savedTheme !== 'light';
        document.documentElement.classList.toggle('dark', shouldUseDark);
        themeListeners.forEach((listener) => listener());
    }, []);

    const toggleTheme = () => {
        const newThemeIsDark = !isDark;
        document.documentElement.classList.toggle('dark', newThemeIsDark);
        window.localStorage.setItem('theme', newThemeIsDark ? 'dark' : 'light');
        themeListeners.forEach((listener) => listener());
    };

    return (
        <button 
            type="button" 
            onClick={toggleTheme} 
            className="p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer" 
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
}