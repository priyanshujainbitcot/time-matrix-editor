import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NoteEntity } from '@/services/databaseService';

interface NotesState {
    items: NoteEntity[];
    activeNoteId: string | null;
}

const initialState: NotesState = {
    items: [],
    activeNoteId: null,
};

const notesSlice = createSlice({
    name: 'notes',
    initialState,
    reducers: {
        setNotes: (state, action: PayloadAction<NoteEntity[]>) => {
            state.items = action.payload;
        },
        addNote: (state, action: PayloadAction<NoteEntity>) => {
            state.items.unshift(action.payload); // Add to top
            state.activeNoteId = action.payload.id;
        },
        updateNote: (state, action: PayloadAction<{ id: string; content: string; title: string }>) => {
            const note = state.items.find(n => n.id === action.payload.id);
            if (note) {
                note.content = action.payload.content;
                note.title = action.payload.title;
                note.updatedAt = Date.now();
            }
        },
        updateNoteTitle: (state, action: PayloadAction<{ id: string; title: string }>) => {
            const note = state.items.find(n => n.id === action.payload.id);
            if (note) {
                note.title = action.payload.title;
                note.updatedAt = Date.now();
            }
        },
        setActiveNote: (state, action: PayloadAction<string | null>) => {
            state.activeNoteId = action.payload;
        },
        deleteNote: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter(n => n.id !== action.payload);
            if (state.activeNoteId === action.payload) {
                state.activeNoteId = state.items.length > 0 ? state.items[0].id : null;
            }
        }
    },
});

export const { setNotes, addNote, updateNote, updateNoteTitle, setActiveNote, deleteNote } = notesSlice.actions;
export default notesSlice.reducer;