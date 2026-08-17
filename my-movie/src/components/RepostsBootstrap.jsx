import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectIsLoggedIn,
  selectAuthReady,
} from '../store/slices/userSlice';
import {
  setRepostItems,
  setRepostStatus,
  clearReposts,
  selectRepostItems,
} from '../store/slices/repostsSlice';
import { fetchReposts, replaceRepostsRequest } from '../api/repostsApi';

/**
 * Login: server repostlarni yuklaydi.
 * Server bo‘sh + local yozuvlar → bir marta PUT migratsiya.
 * Logout: local tozalanadi.
 */
const RepostsBootstrap = () => {
  const dispatch = useAppDispatch();
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const localItems = useAppSelector(selectRepostItems);
  const migratedRef = useRef(false);
  const wasLoggedInRef = useRef(false);
  const localItemsRef = useRef(localItems);
  localItemsRef.current = localItems;

  useEffect(() => {
    if (!authReady) return undefined;

    if (!isLoggedIn) {
      if (wasLoggedInRef.current) {
        dispatch(clearReposts());
      }
      wasLoggedInRef.current = false;
      migratedRef.current = false;
      return undefined;
    }

    wasLoggedInRef.current = true;
    let cancelled = false;

    (async () => {
      dispatch(setRepostStatus('loading'));
      try {
        const data = await fetchReposts();
        if (cancelled) return;
        let items = Array.isArray(data?.items) ? data.items : [];

        const pendingLocal = localItemsRef.current;
        if (items.length === 0 && pendingLocal.length > 0 && !migratedRef.current) {
          migratedRef.current = true;
          const migrated = await replaceRepostsRequest(
            pendingLocal.map((x) => ({ id: x.id, type: x.type }))
          );
          if (cancelled) return;
          items = Array.isArray(migrated?.items) ? migrated.items : [];
        }

        dispatch(setRepostItems(items));
      } catch {
        if (!cancelled) {
          dispatch(setRepostStatus('error'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, isLoggedIn, dispatch]);

  return null;
};

export default RepostsBootstrap;
