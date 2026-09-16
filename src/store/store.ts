import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from './slices/tasksSlice';
import notesReducer from './slices/notesSlice';
import matrixReducer from './slices/matrixSlice';
import navigationReducer from './slices/navigationSlice';

export const store = configureStore({
    reducer: {
        tasks: tasksReducer,
        notes: notesReducer,
        matrix: matrixReducer,
        navigation: navigationReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;