import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectIsLoggedIn,
  selectAuthReady,
  selectProfile,
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
  const profile = useAppSelector(selectProfile);
  const localItems = useAppSelector(selectFollowingItems);
  const migratedRef = useRef(false);
  const wasLoggedInRef = useRef(false);
  const localItemsRef = useRef(localItems);
  localItemsRef.current = localItems;
  const prevProfileIdRef = useRef(profile?.id || null);

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

    // Aktiv account (profile.id) o'zgarganda followinglarni ham qayta yuklaymiz.
    const currentProfileId = profile?.id || null;
    if (prevProfileIdRef.current !== currentProfileId) {
      migratedRef.current = false;
      dispatch(clearFollowing());
      // eski local migration aralashmasin
      localItemsRef.current = [];
      prevProfileIdRef.current = currentProfileId;
    }
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
  }, [authReady, isLoggedIn, profile?.id, dispatch]);

  return null;
};

export default FollowingBootstrap;
