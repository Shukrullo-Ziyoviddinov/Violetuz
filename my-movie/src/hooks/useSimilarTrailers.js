import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '../store/hooks';
import { selectAuthReady, selectIsLoggedIn } from '../store/slices/userSlice';
import { fetchSimilarTrailers } from '../api/similarTrailersApi';
import { GUEST_MOVIE_HISTORY_CHANGED } from '../utils/localStorage/guestHistory/events';

/**
 * .similar-trailers-list
 * Hisob cookie bilan. Mehmon local tarix bilan. Local hisobga yozilmaydi.
 */
export function useSimilarTrailers() {
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
    queryKey: ['similar-trailers', isLoggedIn ? 'account' : 'guest', guestEpoch],
    enabled: authReady,
    queryFn: () => fetchSimilarTrailers({ isLoggedIn }),
  });
}
