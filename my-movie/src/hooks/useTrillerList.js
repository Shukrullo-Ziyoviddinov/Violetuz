import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '../store/hooks';
import { selectAuthReady, selectIsLoggedIn, selectProfile } from '../store/slices/userSlice';
import { fetchAllTrillers } from '../api/trillersApi';
import { GUEST_MOVIE_HISTORY_CHANGED } from '../utils/localStorage/guestHistory/events';

/**
 * Parda ortida ro‘yxati.
 * Hisob cookie bilan. Mehmon local tarix bilan. Local hisobga yozilmaydi.
 */
export function useTrillerList() {
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const accountId = useAppSelector(selectProfile)?.id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isLoggedIn) return undefined;
    const bump = () => { void queryClient.invalidateQueries({ queryKey: ['trillers', 'with-description', 'guest'] }); };
    window.addEventListener(GUEST_MOVIE_HISTORY_CHANGED, bump);
    return () => window.removeEventListener(GUEST_MOVIE_HISTORY_CHANGED, bump);
  }, [isLoggedIn, queryClient]);

  const result = useQuery({
    queryKey: ['trillers', 'with-description', isLoggedIn ? `account:${accountId}` : 'guest'],
    enabled: authReady,
    queryFn: ({ signal }) => fetchAllTrillers({ isLoggedIn, signal }),
  });
  return { ...result, data: authReady ? result.data : undefined, isPending: !authReady || result.isPending };
}
