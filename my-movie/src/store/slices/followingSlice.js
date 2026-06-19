import { createSlice } from '@reduxjs/toolkit';
import { sameFollowId } from './followingUtils';

const initialState = {
  ids: [],
};

const followingSlice = createSlice({
  name: 'following',
  initialState,
  reducers: {
    follow: (state, action) => {
      const id = action.payload;
      if (id == null || id === '') return;
      if (state.ids.some((x) => sameFollowId(x, id))) return;
      state.ids.push(id);
    },
    unfollow: (state, action) => {
      const id = action.payload;
      if (id == null || id === '') return;
      state.ids = state.ids.filter((x) => !sameFollowId(x, id));
    },
    toggleFollowing: (state, action) => {
      const id = action.payload;
      if (id == null || id === '') return;
      const idx = state.ids.findIndex((x) => sameFollowId(x, id));
      if (idx >= 0) {
        state.ids.splice(idx, 1);
      } else {
        state.ids.push(id);
      }
    },
  },
});

export const { follow, unfollow, toggleFollowing } = followingSlice.actions;

export const selectFollowingIds = (state) => state.following.ids;

export const selectIsFollowing = (state, id) => {
  if (id == null || id === '') return false;
  return state.following.ids.some((x) => sameFollowId(x, id));
};

export default followingSlice.reducer;
