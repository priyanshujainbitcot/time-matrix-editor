'use client';

import { useState, FormEvent, KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { useIsExtension } from '@/hooks/useIsExtension';

/**
 * SearchBar Component
 * 
 * A beautiful, minimalist search bar that redirects to Google Search.
 * Only renders when running as a Chrome Extension (hydration-safe).
 * 
 * Features:
 * - Detects URLs and navigates directly
 * - Searches Google for non-URL queries
 * - Dark/light mode support
 * - Elegant animations
 * - Keyboard accessible
 */
export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const isExtension = useIsExtension();

    // Don't render anything if not in extension context
    if (!isExtension) {
        return null;
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!query.trim()) return;

        const trimmedQuery = query.trim();

        // Check if it's a URL (has protocol or looks like a domain)
        const urlPattern = /^(https?:\/\/|www\.)/i;
        const domainPattern = /^[a-z0-9-]+\.[a-z]{2,}$/i;

        if (urlPattern.test(trimmedQuery)) {
            // Has protocol or starts with www
            const url = trimmedQuery.startsWith('http') ? trimmedQuery : `https://${trimmedQuery}`;
            window.location.href = url;
        } else if (domainPattern.test(trimmedQuery)) {
            // Looks like a domain (e.g., "github.com")
            window.location.href = `https://${trimmedQuery}`;
        } else {
            // Search Google
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(trimmedQuery)}`;
            window.location.href = searchUrl;
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        // Allow Escape to clear and blur
        if (e.key === 'Escape') {
            setQuery('');
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <div className="w-full flex justify-center items-center px-4 pt-16 pb-8 animate-fade-in">
            <div className="w-full max-w-[456px]">
                <h1 className="text-5xl font-normal text-center text-muted-foreground mb-8 tracking-tight">
                    Search
                </h1>

                <form onSubmit={handleSubmit} className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200">
                        <Search 
                            size={18} 
                            className={`${
                                isFocused 
                                    ? 'text-foreground' 
                                    : 'text-muted-foreground'
                            }`}
                            strokeWidth={1.8}
                        />
                    </div>

                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search Google or type a URL"
                        autoComplete="off"
                        spellCheck="false"
                        className={`
                            w-full 
                            pl-12 pr-4 py-3
                            text-sm
                            bg-muted/70 dark:bg-muted/70
                            text-foreground dark:text-foreground
                            placeholder:text-muted-foreground dark:placeholder:text-muted-foreground
                            border border-transparent
                            rounded-full
                            outline-none
                            transition-colors duration-200
                            ${isFocused 
                                ? 'bg-muted dark:bg-muted ring-1 ring-border' 
                                : 'hover:bg-muted dark:hover:bg-muted'
                            }
                        `}
                    />

                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-background/70 transition-colors duration-200 text-muted-foreground hover:text-foreground"
                            aria-label="Clear search"
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    )}
                </form>

               
            </div>
        </div>
    );
}
