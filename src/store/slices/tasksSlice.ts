import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Task {
    id: string;
    title: string;
    quadrant: 1 | 2 | 3 | 4;
    status: 'pending' | 'in-progress' | 'done';
    createdAt?: number;
}

export interface DeletedTaskItem {
    task: Task;
    deletedAt: number;
}

interface TasksState {
    items: Task[];
    isLoaded: boolean;
    undoStack: DeletedTaskItem[];
}

const initialState: TasksState = {
    items: [],
    isLoaded: false,
    undoStack: [],
};

const tasksSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        setTasks: (state, action: PayloadAction<Task[]>) => {
            state.items = action.payload;
            state.isLoaded = true;
        },
        setDeletedTasks: (state, action: PayloadAction<DeletedTaskItem[]>) => {
            state.undoStack = action.payload;
        },
        addTask: (state, action: PayloadAction<Task>) => {
            state.items.push(action.payload);
        },
        updateTaskStatus: (state, action: PayloadAction<{ id: string; status: Task['status'] }>) => {
            const task = state.items.find(t => t.id === action.payload.id);
            if (task) {
                task.status = action.payload.status;
            }
        },
        editTask: (state, action: PayloadAction<{ id: string; title: string }>) => {
            const task = state.items.find(t => t.id === action.payload.id);
            if (task) {
                task.title = action.payload.title;
            }
        },
        moveTask: (state, action: PayloadAction<{ id: string; quadrant: Task['quadrant'] }>) => {
            const task = state.items.find(t => t.id === action.payload.id);
            if (task) {
                task.quadrant = action.payload.quadrant;
            }
        },
        deleteTask: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter(t => t.id !== action.payload);
        },
        addToUndoStack: (state, action: PayloadAction<DeletedTaskItem>) => {
            state.undoStack.push(action.payload);
        },
        removeFromUndoStack: (state, action: PayloadAction<string>) => {
            state.undoStack = state.undoStack.filter(item => item.task.id !== action.payload);
        },
        clearUndoStack: (state) => {
            state.undoStack = [];
        },
    },
});

export const {
    setTasks,
    setDeletedTasks,
    addTask,
    updateTaskStatus,
    editTask,
    moveTask,
    deleteTask,
    addToUndoStack,
    removeFromUndoStack,
    clearUndoStack
} = tasksSlice.actions;

export default tasksSlice.reducer;