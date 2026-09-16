'use client';

import { useEffect } from 'react';
import { extensionLog } from '@/lib/extensionUtils';

export default function ClientInit() {
    useEffect(() => {
        // Banner to make it obvious React loaded
        console.log('%c🎉 React Hydration SUCCESS!', 'color: #0f0; font-size: 20px; font-weight: bold;');
        extensionLog('✅ React has hydrated successfully!');
        extensionLog('Location:', window.location.href);
        extensionLog('Protocol:', window.location.protocol);
        extensionLog('Extension ID:', window.location.hostname);
        
        // Log that event handlers are attached
        console.log('%c✅ Event handlers attached - buttons should work!', 'color: #00f; font-size: 14px;');
        
        // Test if event listeners work
        const testClick = (e: MouseEvent) => {
            console.log('🎯 Click detected at:', e.target);
        };
        
        document.addEventListener('click', testClick);
        
        return () => {
            document.removeEventListener('click', testClick);
        };
    }, []);
    
    return null;
}

