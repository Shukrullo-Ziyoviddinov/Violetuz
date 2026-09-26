import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectAuthReady, selectIsLoggedIn } from '../store/slices/userSlice';
import { fetchMusicMixes } from '../api/musicMixApi';

/**
 * Login: tayyor mix. Mehmon: bo'sh, so'rov yo'q.
 * @param {{ enabled?: boolean }} [opts]
 */
export function useMusicMixes({ enabled = true } = {}) {
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const [mixes, setMixes] = useState([]);
  const [isLoading, setIsLoading] = useState(enabled);

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setMixes([]);
      setIsLoading(false);
      return undefined;
    }

    if (!authReady) {
      setMixes([]);
      setIsLoading(true);
      return undefined;
    }

    if (!isLoggedIn) {
      setMixes([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    fetchMusicMixes()
      .then((rows) => {
        if (!cancelled) setMixes(rows);
      })
      .catch(() => {
        if (!cancelled) setMixes([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authReady, enabled, isLoggedIn]);

  return { mixes, isLoading };
}
