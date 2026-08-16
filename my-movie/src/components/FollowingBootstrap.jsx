import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectIsLoggedIn,
  selectAuthReady,
} from '../store/slices/userSlice';
import {
  setFollowingItems,
  setFollowingStatus,
  clearFollowing,
  selectFollowingItems,
} from '../store/slices/followingSlice';
import { fetchFollowing, replaceFollowingRequest } from '../api/followingApi';

/**
 * Login: server following yuklash.
 * Server bo‘sh + local → PUT migratsiya (type yo‘q bo‘lsa server artist/actor aniqlaydi).
 */
const FollowingBootstrap = () => {
  const dispatch = useAppDispatch();
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const localItems = useAppSelector(selectFollowingItems);
  const migratedRef = useRef(false);
  const wasLoggedInRef = useRef(false);
  const localItemsRef = useRef(localItems);
  localItemsRef.current = localItems;

  useEffect(() => {
    if (!authReady) return undefined;

    if (!isLoggedIn) {
      if (wasLoggedInRef.current) {
        dispatch(clearFollowing());
      }
      wasLoggedInRef.current = false;
      migratedRef.current = false;
      return undefined;
    }

    wasLoggedInRef.current = true;
    let cancelled = false;

    (async () => {
      dispatch(setFollowingStatus('loading'));
      try {
        const data = await fetchFollowing();
        if (cancelled) return;
        let items = Array.isArray(data?.items) ? data.items : [];

        const pendingLocal = localItemsRef.current;
        if (items.length === 0 && pendingLocal.length > 0 && !migratedRef.current) {
          migratedRef.current = true;
          const migrated = await replaceFollowingRequest(
            pendingLocal.map((x) => ({ id: x.id, type: x.type || undefined }))
          );
          if (cancelled) return;
          items = Array.isArray(migrated?.items) ? migrated.items : [];
        }

        dispatch(setFollowingItems(items));
      } catch {
        if (!cancelled) {
          dispatch(setFollowingStatus('error'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, isLoggedIn, dispatch]);

  return null;
};

export default FollowingBootstrap;
