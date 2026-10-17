import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '../store/hooks';
import { selectAuthReady, selectIsLoggedIn } from '../store/slices/userSlice';
import { fetchAllTrillers } from '../api/trillersApi';
import { GUEST_MOVIE_HISTORY_CHANGED } from '../utils/localStorage/guestHistory/events';

/**
 * Parda ortida ro‘yxati.
 * Hisob cookie bilan. Mehmon local tarix bilan. Local hisobga yozilmaydi.
 */
export function useTrillerList() {
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const [guestEpoch, setGuestEpoch] = useState(0);

  useEffect(() => {
    if (isLoggedIn) return undefined;
    const bump = () => setGuestEpoch((value) => value + 1);
    window.addEventListener(GUEST_MOVIE_HISTORY_CHANGED, bump);
    return () => window.removeEventListener(GUEST_MOVIE_HISTORY_CHANGED, bump);
  }, [isLoggedIn]);

  return useQuery({
    queryKey: ['trillers', 'with-description', isLoggedIn ? 'account' : 'guest', guestEpoch],
    enabled: authReady,
    queryFn: () => fetchAllTrillers({ isLoggedIn }),
  });
}
