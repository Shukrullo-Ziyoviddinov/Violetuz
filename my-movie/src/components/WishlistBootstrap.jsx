import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectIsLoggedIn,
  selectAuthReady,
} from '../store/slices/userSlice';
import {
  setWishlistItems,
  setWishlistStatus,
  clearWishlist,
  selectWishlistItems,
} from '../store/slices/wishlistSlice';
import { fetchWishlist, replaceWishlistRequest } from '../api/wishlistApi';

/**
 * Login: server wishlistni yuklaydi.
 * Server bo‘sh + local yozuvlar → bir marta PUT migratsiya.
 * Logout (login→chiqish): local tozalanadi.
 */
const WishlistBootstrap = () => {
  const dispatch = useAppDispatch();
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const localItems = useAppSelector(selectWishlistItems);
  const migratedRef = useRef(false);
  const wasLoggedInRef = useRef(false);
  const localItemsRef = useRef(localItems);
  localItemsRef.current = localItems;

  useEffect(() => {
    if (!authReady) return undefined;

    if (!isLoggedIn) {
      if (wasLoggedInRef.current) {
        dispatch(clearWishlist());
      }
      wasLoggedInRef.current = false;
      migratedRef.current = false;
      return undefined;
    }

    wasLoggedInRef.current = true;
    let cancelled = false;

    (async () => {
      dispatch(setWishlistStatus('loading'));
      try {
        const data = await fetchWishlist();
        if (cancelled) return;
        let items = Array.isArray(data?.items) ? data.items : [];

        const pendingLocal = localItemsRef.current;
        if (items.length === 0 && pendingLocal.length > 0 && !migratedRef.current) {
          migratedRef.current = true;
          const migrated = await replaceWishlistRequest(
            pendingLocal.map((x) => ({ id: x.id, type: x.type }))
          );
          if (cancelled) return;
          items = Array.isArray(migrated?.items) ? migrated.items : [];
        }

        dispatch(setWishlistItems(items));
      } catch {
        if (!cancelled) {
          dispatch(setWishlistStatus('error'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, isLoggedIn, dispatch]);

  return null;
};

export default WishlistBootstrap;
