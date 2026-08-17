import { createSlice } from '@reduxjs/toolkit';
import { sanitizeRepostItem } from '../../components/Repost/repostTypes';
import { isRepostedInList, makeRepostKey, toggleRepostInList } from './repostsUtils';

const toStoredItem = (raw) => sanitizeRepostItem(raw);

const initialState = {
  items: [],
  /** idle | loading | ready | error */
  status: 'idle',
  synced: false,
};

const findIndexByKey = (items, item) => {
  const key = makeRepostKey(item.id, item.type);
  return items.findIndex((x) => makeRepostKey(x.id, x.type) === key);
};

const repostsSlice = createSlice({
  name: 'reposts',
  initialState,
  reducers: {
    setRepostStatus: (state, action) => {
      state.status = action.payload || 'idle';
    },
    setRepostItems: (state, action) => {
      const list = Array.isArray(action.payload) ? action.payload : [];
      state.items = list.map(toStoredItem).filter(Boolean);
      state.synced = true;
      state.status = 'ready';
    },
    clearReposts: (state) => {
      state.items = [];
      state.synced = false;
      state.status = 'idle';
    },
    addRepost: (state, action) => {
      const next = toStoredItem(action.payload);
      if (!next) return;
      const idx = findIndexByKey(state.items, next);
      if (idx >= 0) {
        state.items[idx] = { ...state.items[idx], ...next };
        return;
      }
      state.items.unshift(next);
    },
    removeRepost: (state, action) => {
      const next = toStoredItem(action.payload);
      if (!next) return;
      const key = makeRepostKey(next.id, next.type);
      state.items = state.items.filter((x) => makeRepostKey(x.id, x.type) !== key);
    },
    toggleRepost: (state, action) => {
      state.items = toggleRepostInList(state.items, action.payload);
    },
  },
});

export const {
  setRepostStatus,
  setRepostItems,
  clearReposts,
  addRepost,
  removeRepost,
  toggleRepost,
} = repostsSlice.actions;

export const selectRepostItems = (state) => state.reposts.items;

export const selectIsReposted = (state, id, type) =>
  isRepostedInList(state.reposts.items, id, type);

export default repostsSlice.reducer;
