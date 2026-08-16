import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addToWishlist as addToWishlistAction,
  removeFromWishlist as removeFromWishlistAction,
  toggleWishlist as toggleWishlistAction,
  setWishlistItems,
  selectWishlistItems,
  selectWishlistIds,
} from '../store/slices/wishlistSlice';
import { selectIsLoggedIn } from '../store/slices/userSlice';
import {
  addWishlistItemRequest,
  removeWishlistItemRequest,
  toggleWishlistItemRequest,
} from '../api/wishlistApi';
import { requestOpenAuthModal } from '../authModalBridge';

/** @deprecated Redux Provider yetarli — eski importlar buzilmasligi uchun qoldirilgan */
export const WishlistProvider = ({ children }) => children;

const requireAuthOrOpenRegister = (isLoggedIn) => {
  if (isLoggedIn) return true;
  requestOpenAuthModal('register');
  return false;
};

export const useWishlist = () => {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector(selectWishlistItems);
  const wishlistIds = useAppSelector(selectWishlistIds);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  const addToWishlist = useCallback(
    async (id, type = 'movie') => {
      if (!requireAuthOrOpenRegister(isLoggedIn)) return;
      dispatch(addToWishlistAction({ id, type }));
      try {
        const data = await addWishlistItemRequest({ id, type });
        if (data?.item) {
          dispatch(
            addToWishlistAction({
              id: data.item.id,
              type: data.item.type,
              snapshot: data.item.snapshot,
            })
          );
        }
      } catch {
        dispatch(removeFromWishlistAction({ id, type }));
      }
    },
    [dispatch, isLoggedIn]
  );

  const removeFromWishlist = useCallback(
    async (id, type) => {
      if (!requireAuthOrOpenRegister(isLoggedIn)) return;
      dispatch(removeFromWishlistAction({ id, type }));
      try {
        await removeWishlistItemRequest({ id, type });
      } catch {
        dispatch(addToWishlistAction({ id, type }));
      }
    },
    [dispatch, isLoggedIn]
  );

  const toggleWishlist = useCallback(
    async (id, type = 'movie') => {
      if (!requireAuthOrOpenRegister(isLoggedIn)) return;

      const had = wishlistItems.some((x) => x.id == id && x.type === type);
      dispatch(toggleWishlistAction({ id, type }));

      try {
        const data = await toggleWishlistItemRequest({ id, type });
        if (Array.isArray(data?.items)) {
          dispatch(setWishlistItems(data.items));
        } else if (data?.added && data?.item) {
          dispatch(
            addToWishlistAction({
              id: data.item.id,
              type: data.item.type,
              snapshot: data.item.snapshot,
            })
          );
        }
      } catch {
        if (had) {
          dispatch(addToWishlistAction({ id, type }));
        } else {
          dispatch(removeFromWishlistAction({ id, type }));
        }
      }
    },
    [dispatch, isLoggedIn, wishlistItems]
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
