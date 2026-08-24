import Dexie, { Table } from 'dexie';

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
        this.version(3).stores({
            tasks: 'id, quadrant, status, createdAt',
            notes: 'id, updatedAt',
            deletedTasks: 'taskId, deletedAt'
        });
    }
}

export const db = new BristnoteDatabase();

export const getCurrentTimestamp = () => Date.now();

export const createNote = async (): Promise<NoteEntity> => {
    const newNote: NoteEntity = {
        id: Date.now().toString(),
        title: 'Untitled Note',
        content: '',
        updatedAt: Date.now(),
    };

    await db.notes.add(newNote);
    return newNote;
};

export const createTask = async (title: string, quadrant: TaskEntity['quadrant']): Promise<TaskEntity> => {
    const newTask: TaskEntity = {
        id: Date.now().toString(),
        title,
        quadrant,
        status: 'pending',
        createdAt: Date.now(),
    };

    await db.tasks.add(newTask);
    return newTask;
};