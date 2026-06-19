import { createSlice } from '@reduxjs/toolkit';
import { isRepostedInList, toggleRepostInList } from './repostsUtils';

const initialState = {
  items: [],
};

const repostsSlice = createSlice({
  name: 'reposts',
  initialState,
  reducers: {
    toggleRepost: (state, action) => {
      state.items = toggleRepostInList(state.items, action.payload);
    },
  },
});

export const { toggleRepost } = repostsSlice.actions;

export const selectRepostItems = (state) => state.reposts.items;

export const selectIsReposted = (state, id, type) =>
  isRepostedInList(state.reposts.items, id, type);

export default repostsSlice.reducer;
