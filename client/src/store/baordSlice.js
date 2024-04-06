import { createSlice } from '@reduxjs/toolkit';

const boardSlice = createSlice({
  name: 'board',
  initialState: {
    id: null,
  },
  reducers: {
    setBoardId(state, action) {
      state.id = action.payload;
    },
  },
});

export const { setBoardId } = boardSlice.actions;
export default boardSlice.reducer;
  