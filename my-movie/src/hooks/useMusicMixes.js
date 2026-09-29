import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectAuthReady, selectIsLoggedIn } from '../store/slices/userSlice';
import { fetchMusicMixes } from '../api/musicMixApi';
import { getGuestMixes } from '../utils/musicMix/assembleGuestMixes';
import { GUEST_MUSIC_MIX_PLAYS_CHANGED } from '../utils/localStorage/guestHistory/events';

/**
 * Login: GET /music/mixes (server).
 * Mehmon: local assemble (violet_guest_music_mix_plays_v1) — server so‘rovi yo‘q.
 * @param {{ enabled?: boolean }} [opts]
 */
export function useMusicMixes({ enabled = true } = {}) {
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const [mixes, setMixes] = useState([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [guestMixEpoch, setGuestMixEpoch] = useState(0);

  useEffect(() => {
    const onGuestMix = () => setGuestMixEpoch((n) => n + 1);
    window.addEventListener(GUEST_MUSIC_MIX_PLAYS_CHANGED, onGuestMix);
    return () => window.removeEventListener(GUEST_MUSIC_MIX_PLAYS_CHANGED, onGuestMix);
  }, []);

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
      setMixes(getGuestMixes());
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
  }, [authReady, enabled, isLoggedIn, guestMixEpoch]);

  return { mixes, isLoading };
}
