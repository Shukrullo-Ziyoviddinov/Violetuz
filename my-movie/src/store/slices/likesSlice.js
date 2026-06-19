import { createSlice } from '@reduxjs/toolkit';
import { removeItemFromList, upsertItemInList } from './likesUtils';

const initialState = {
  items: [],
  reactions: {},
  shortsLikedIds: [],
};

const likesSlice = createSlice({
  name: 'likes',
  initialState,
  reducers: {
    upsertLikeHistoryItem: (state, action) => {
      const { meta, contentId } = action.payload || {};
      state.items = upsertItemInList(state.items, meta, contentId);
    },
    removeLikeHistoryItem: (state, action) => {
      const { meta, contentId } = action.payload || {};
      state.items = removeItemFromList(state.items, meta, contentId);
    },
    setReaction: (state, action) => {
      const { key, value } = action.payload || {};
      if (!key) return;
      if (value === 'none' || !value) {
        delete state.reactions[key];
      } else {
        state.reactions[key] = value;
      }
    },
    toggleShortsLike: (state, action) => {
      if (action.payload == null || action.payload === '') return;
      const id = String(action.payload);
      const idx = state.shortsLikedIds.indexOf(id);
      if (idx >= 0) {
        state.shortsLikedIds.splice(idx, 1);
      } else {
        state.shortsLikedIds.push(id);
      }
    },
  },
});

export const {
  upsertLikeHistoryItem,
  removeLikeHistoryItem,
  setReaction,
  toggleShortsLike,
} = likesSlice.actions;

export const selectLikeHistoryItems = (state) => state.likes.items;

export const selectReaction = (state, key) => {
  if (!key) return 'none';
  return state.likes.reactions[key] || 'none';
};

export const selectShortsLikeCount = (state, shortsId) => {
  if (shortsId == null || shortsId === '') return 0;
  return state.likes.shortsLikedIds.includes(String(shortsId)) ? 1 : 0;
};

export default likesSlice.reducer;
