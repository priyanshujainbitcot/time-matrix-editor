import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AppView = 'default' | 'matrix' | 'tasks' | 'notes';

interface NavigationState {
  currentView: AppView;
}

const initialState: NavigationState = {
  currentView: 'default', // Start with default home page
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setView: (state, action: PayloadAction<AppView>) => {
      state.currentView = action.payload;
    },
  },
});

export const { setView } = navigationSlice.actions;
export default navigationSlice.reducer;
