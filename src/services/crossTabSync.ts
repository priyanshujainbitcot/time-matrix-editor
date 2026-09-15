/**
 * Cross-tab synchronization via BroadcastChannel.
 * When a note is created, updated, or deleted in one browser tab,
 * other tabs receive a notification and can re-fetch from IndexedDB.
 */
const channel = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('tnmatrix-notes-sync')
    : null;

/** Call after any successful Dexie write (create, update, delete). */
export const notifyNotesChanged = () => {
    channel?.postMessage({ type: 'notes-changed', timestamp: Date.now() });
};

/**
 * Register a listener for note changes from other tabs.
 * Returns an unsubscribe function for cleanup in useEffect.
 */
export const onNotesChanged = (callback: () => void): (() => void) => {
    if (!channel) return () => {};
    const handler = (event: MessageEvent) => {
        if (event.data?.type === 'notes-changed') callback();
    };
    channel.addEventListener('message', handler);
    return () => channel.removeEventListener('message', handler);
};
