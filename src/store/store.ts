import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from './slices/tasksSlice';
import notesReducer from './slices/notesSlice';
import matrixReducer from './slices/matrixSlice';

export const store = configureStore({
    reducer: {
        tasks: tasksReducer,
        notes: notesReducer,
        matrix: matrixReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;