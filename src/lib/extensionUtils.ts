/**
 * Extension environment utilities
 */

export const isExtensionContext = () => {
    if (typeof window === 'undefined') return false;
    return window.location.protocol === 'chrome-extension:';
};

export const getExtensionId = () => {
    if (!isExtensionContext()) return null;
    return window.location.hostname;
};

/**
 * Safely get chrome API (works in both dev and extension contexts)
 */
export const getChromeAPI = () => {
    if (typeof window !== 'undefined' && 'chrome' in window) {
        return (window as any).chrome;
    }
    return null;
};

/**
 * Log helper that works in extension context
 */
export const extensionLog = (...args: any[]) => {
    const prefix = '[TNMatrix Extension]';
    console.log(prefix, ...args);
};

/**
 * Error handler for extension context
 */
export const handleExtensionError = (error: Error, context?: string) => {
    const prefix = context ? `[TNMatrix Extension - ${context}]` : '[TNMatrix Extension]';
    console.error(prefix, error);
};
