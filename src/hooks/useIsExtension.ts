'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the app is running as a Chrome Extension.
 * 
 * This hook is hydration-safe because it:
 * 1. Returns false during SSR/SSG (server-side)
 * 2. Checks the environment only after component mounts (client-side)
 * 3. Prevents hydration mismatch by using useEffect
 * 
 * @returns {boolean} true if running as Chrome Extension, false otherwise
 */
export function useIsExtension(): boolean {
    const [isExtension, setIsExtension] = useState(false);

    useEffect(() => {
        // Multiple checks for robust detection
        const checkExtensionEnvironment = () => {
            // Check 1: Protocol check (most reliable)
            if (typeof window !== 'undefined' && window.location.protocol === 'chrome-extension:') {
                return true;
            }

            // Check 2: Chrome runtime API (fallback)
            // Use type assertion to avoid TypeScript errors
            if (typeof window !== 'undefined' && 'chrome' in window) {
                const chromeAPI = (window as any).chrome;
                if (chromeAPI?.runtime?.id) {
                    return true;
                }
            }

            // Check 3: Extension-specific hostname pattern
            if (typeof window !== 'undefined' && window.location.hostname.length === 32) {
                // Chrome extension IDs are always 32 characters
                return true;
            }

            return false;
        };

        setIsExtension(checkExtensionEnvironment());
    }, []);

    return isExtension;
}
