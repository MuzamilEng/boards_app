import { configureStore } from '@reduxjs/toolkit';
import boardReducer from './baordSlice'; // Import the reducer

const store = configureStore({
    reducer: {
      board: boardReducer,
    },
  });

export default store;
