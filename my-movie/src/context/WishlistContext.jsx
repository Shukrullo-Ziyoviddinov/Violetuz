import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addToWishlist as addToWishlistAction,
  removeFromWishlist as removeFromWishlistAction,
  toggleWishlist as toggleWishlistAction,
  selectWishlistItems,
  selectWishlistIds,
} from '../store/slices/wishlistSlice';

/** @deprecated Redux Provider yetarli — eski importlar buzilmasligi uchun qoldirilgan */
export const WishlistProvider = ({ children }) => children;

export const useWishlist = () => {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector(selectWishlistItems);
  const wishlistIds = useAppSelector(selectWishlistIds);

  const addToWishlist = useCallback(
    (id, type = 'movie') => dispatch(addToWishlistAction({ id, type })),
    [dispatch]
  );

  const removeFromWishlist = useCallback(
    (id, type) => dispatch(removeFromWishlistAction({ id, type })),
    [dispatch]
  );

  const toggleWishlist = useCallback(
    (id, type = 'movie') => dispatch(toggleWishlistAction({ id, type })),
    [dispatch]
  );

  const isInWishlist = useCallback(
    (id, type = 'movie') => wishlistItems.some((x) => x.id == id && x.type === type),
    [wishlistItems]
  );

  return {
    wishlistItems,
    wishlistIds,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
  };
};
