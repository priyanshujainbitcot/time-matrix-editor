import Dexie, { Table } from 'dexie';
import { extensionLog, handleExtensionError } from '@/lib/extensionUtils';

export interface TaskEntity {
    id: string;
    title: string;
    quadrant: 1 | 2 | 3 | 4;
    status: 'pending' | 'in-progress' | 'done';
    createdAt?: number;
}

export interface NoteEntity {
    id: string;
    title: string;
    content: string;
    updatedAt: number;
}

export interface DeletedTaskEntity {
    taskId: string;
    task: TaskEntity;
    deletedAt: number;
}

export class BristnoteDatabase extends Dexie {
    tasks!: Table<TaskEntity>;
    notes!: Table<NoteEntity>;
    deletedTasks!: Table<DeletedTaskEntity>;

    constructor() {
        super('BristnoteDB');
        
        try {
            this.version(3).stores({
                tasks: 'id, quadrant, status, createdAt',
                notes: 'id, updatedAt',
                deletedTasks: 'taskId, deletedAt'
            });
            
            // Log successful initialization in extension context
            if (typeof window !== 'undefined' && window.location.protocol === 'chrome-extension:') {
                extensionLog('IndexedDB initialized successfully');
            }
        } catch (error) {
            handleExtensionError(error as Error, 'Database Init');
            throw error;
        }
    }
}

export const db = new BristnoteDatabase();

export const getCurrentTimestamp = () => Date.now();
export const createEntityId = () => {
    // Fallback for environments where crypto.randomUUID might not be available
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback UUID v4 implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const createNote = async (): Promise<NoteEntity> => {
    const newNote: NoteEntity = {
        id: createEntityId(),
        title: 'Untitled Note',
        content: '',
        updatedAt: Date.now(),
    };

    await db.notes.add(newNote);
    return newNote;
};

export const createTask = async (title: string, quadrant: TaskEntity['quadrant']): Promise<TaskEntity> => {
    const newTask: TaskEntity = {
        id: createEntityId(),
        title,
        quadrant,
        status: 'pending',
        createdAt: Date.now(),
    };

    await db.tasks.add(newTask);
    return newTask;
};