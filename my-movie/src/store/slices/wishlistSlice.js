import { createSlice, createSelector } from '@reduxjs/toolkit';
import { normalizeId } from './wishlistUtils';

const initialState = {
  items: [],
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (state, action) => {
      const { id, type = 'movie' } = action.payload;
      const idVal = normalizeId(id);
      if (idVal == null) return;
      if (state.items.some((x) => x.id == idVal && x.type === type)) return;
      state.items.push({ id: idVal, type });
    },
    removeFromWishlist: (state, action) => {
      const { id, type } = action.payload;
      const idVal = normalizeId(id);
      if (idVal == null) return;
      state.items = state.items.filter((x) => !(x.id == idVal && x.type === type));
    },
    toggleWishlist: (state, action) => {
      const { id, type = 'movie' } = action.payload;
      const idVal = normalizeId(id);
      if (idVal == null) return;
      const has = state.items.some((x) => x.id == idVal && x.type === type);
      state.items = has
        ? state.items.filter((x) => !(x.id == idVal && x.type === type))
        : [...state.items, { id: idVal, type }];
    },
  },
});

export const { addToWishlist, removeFromWishlist, toggleWishlist } = wishlistSlice.actions;

export const selectWishlistItems = (state) => state.wishlist.items;

export const selectWishlistIds = createSelector([selectWishlistItems], (items) =>
  items.filter((x) => x.type === 'movie').map((x) => x.id)
);

export default wishlistSlice.reducer;
