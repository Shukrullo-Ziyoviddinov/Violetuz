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
} from '../store/slices/repostsSlice';
import { clearLegacyReposts, loadLegacyReposts } from '../store/slices/repostsUtils';
import { fetchReposts, replaceRepostsRequest } from '../api/repostsApi';

/**
 * Login: serverdan yuklash.
 * Server bo‘sh + eski local → bir marta PUT, keyin local o‘chiriladi.
 * Keyingi yozuvlar faqat server + Redux (xotira).
 */
const RepostsBootstrap = () => {
  const dispatch = useAppDispatch();
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const migratedRef = useRef(false);
  const wasLoggedInRef = useRef(false);

  useEffect(() => {
    if (!authReady) return undefined;

    if (!isLoggedIn) {
      if (wasLoggedInRef.current) {
        dispatch(clearReposts());
        clearLegacyReposts();
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

        const pendingLocal = loadLegacyReposts();
        if (items.length === 0 && pendingLocal.length > 0 && !migratedRef.current) {
          migratedRef.current = true;
          const migrated = await replaceRepostsRequest(
            pendingLocal.map((x) => ({ id: x.id, type: x.type }))
          );
          if (cancelled) return;
          items = Array.isArray(migrated?.items) ? migrated.items : [];
        }

        dispatch(setRepostItems(items));
        clearLegacyReposts();
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
