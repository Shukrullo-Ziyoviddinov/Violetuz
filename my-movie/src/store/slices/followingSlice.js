import { createSlice, createSelector } from '@reduxjs/toolkit';
import { sameFollowId } from './followingUtils';

const toItem = (raw) => {
  if (raw == null) return null;
  if (typeof raw !== 'object') {
    if (raw === '') return null;
    return { id: raw, type: null };
  }
  if (raw.id == null || raw.id === '') return null;
  return {
    id: raw.id,
    type: raw.type === 'actor' || raw.type === 'artist' ? raw.type : null,
    ...(raw.snapshot != null ? { snapshot: raw.snapshot } : {}),
  };
};

const initialState = {
  /** @type {Array<{ id: string|number, type: 'actor'|'artist'|null, snapshot?: object }>} */
  items: [],
  status: 'idle',
  synced: false,
};

const followingSlice = createSlice({
  name: 'following',
  initialState,
  reducers: {
    setFollowingStatus: (state, action) => {
      state.status = action.payload || 'idle';
    },
    setFollowingItems: (state, action) => {
      const list = Array.isArray(action.payload) ? action.payload : [];
      state.items = list.map(toItem).filter(Boolean);
      state.synced = true;
      state.status = 'ready';
    },
    clearFollowing: (state) => {
      state.items = [];
      state.synced = false;
      state.status = 'idle';
    },
    follow: (state, action) => {
      const next = toItem(
        typeof action.payload === 'object'
          ? action.payload
          : { id: action.payload, type: null }
      );
      if (!next) return;
      const has = state.items.some(
        (x) =>
          sameFollowId(x.id, next.id) &&
          (next.type == null || x.type == null || x.type === next.type)
      );
      if (has) return;
      state.items.push(next);
    },
    unfollow: (state, action) => {
      const next = toItem(
        typeof action.payload === 'object'
          ? action.payload
          : { id: action.payload, type: null }
      );
      if (!next) return;
      state.items = state.items.filter((x) => {
        if (!sameFollowId(x.id, next.id)) return true;
        if (next.type && x.type && x.type !== next.type) return true;
        return false;
      });
    },
    toggleFollowing: (state, action) => {
      const next = toItem(
        typeof action.payload === 'object'
          ? action.payload
          : { id: action.payload, type: null }
      );
      if (!next) return;
      const idx = state.items.findIndex(
        (x) =>
          sameFollowId(x.id, next.id) &&
          (next.type == null || x.type == null || x.type === next.type)
      );
      if (idx >= 0) {
        state.items.splice(idx, 1);
      } else {
        state.items.push(next);
      }
    },
  },
});

export const {
  setFollowingStatus,
  setFollowingItems,
  clearFollowing,
  follow,
  unfollow,
  toggleFollowing,
} = followingSlice.actions;

export const selectFollowingItems = (state) => state.following.items;

/** Feed / legacy: barcha target id lar */
export const selectFollowingIds = createSelector([selectFollowingItems], (items) =>
  items.map((x) => x.id)
);

export const selectIsFollowing = (state, id, type = null) => {
  if (id == null || id === '') return false;
  return state.following.items.some(
    (x) =>
      sameFollowId(x.id, id) &&
      (type == null || x.type == null || x.type === type)
  );
};

export default followingSlice.reducer;
