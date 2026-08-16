import { createSlice, createSelector } from '@reduxjs/toolkit';
import { normalizeId } from './wishlistUtils';

const initialState = {
  items: [],
  /** idle | loading | ready | error */
  status: 'idle',
  synced: false,
};

const toStoredItem = (raw) => {
  if (!raw || raw.id == null) return null;
  const id = normalizeId(raw.id);
  if (id == null) return null;
  return {
    id,
    type: raw.type || 'movie',
    ...(raw.snapshot != null ? { snapshot: raw.snapshot } : {}),
  };
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    setWishlistStatus: (state, action) => {
      state.status = action.payload || 'idle';
    },
    setWishlistItems: (state, action) => {
      const list = Array.isArray(action.payload) ? action.payload : [];
      state.items = list.map(toStoredItem).filter(Boolean);
      state.synced = true;
      state.status = 'ready';
    },
    clearWishlist: (state) => {
      state.items = [];
      state.synced = false;
      state.status = 'idle';
    },
    addToWishlist: (state, action) => {
      const next = toStoredItem({
        id: action.payload?.id,
        type: action.payload?.type || 'movie',
        snapshot: action.payload?.snapshot,
      });
      if (!next) return;
      if (state.items.some((x) => x.id == next.id && x.type === next.type)) return;
      state.items.push(next);
    },
    removeFromWishlist: (state, action) => {
      const idVal = normalizeId(action.payload?.id);
      const type = action.payload?.type;
      if (idVal == null || !type) return;
      state.items = state.items.filter((x) => !(x.id == idVal && x.type === type));
    },
    toggleWishlist: (state, action) => {
      const next = toStoredItem({
        id: action.payload?.id,
        type: action.payload?.type || 'movie',
        snapshot: action.payload?.snapshot,
      });
      if (!next) return;
      const has = state.items.some((x) => x.id == next.id && x.type === next.type);
      state.items = has
        ? state.items.filter((x) => !(x.id == next.id && x.type === next.type))
        : [...state.items, next];
    },
  },
});

export const {
  setWishlistStatus,
  setWishlistItems,
  clearWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
} = wishlistSlice.actions;

export const selectWishlistItems = (state) => state.wishlist.items;

export const selectWishlistIds = createSelector([selectWishlistItems], (items) =>
  items.filter((x) => x.type === 'movie').map((x) => x.id)
);

export const selectWishlistSynced = (state) => state.wishlist.synced;

export default wishlistSlice.reducer;
