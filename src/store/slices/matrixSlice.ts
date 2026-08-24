import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MatrixState {
    focusedQuadrant: 1 | 2 | 3 | 4 | null;
}

const initialState: MatrixState = {
    focusedQuadrant: null,
};

const matrixSlice = createSlice({
    name: 'matrix',
    initialState,
    reducers: {
        setFocusedQuadrant: (state, action: PayloadAction<1 | 2 | 3 | 4 | null>) => {
            state.focusedQuadrant = action.payload;
        },
    },
});

export const { setFocusedQuadrant } = matrixSlice.actions;
export default matrixSlice.reducer;