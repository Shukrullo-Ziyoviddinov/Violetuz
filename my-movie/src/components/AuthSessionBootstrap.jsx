import { useEffect } from 'react';
import { fetchMe } from '../api/authApi';
import { useAppDispatch } from '../store/hooks';
import { setAuthSession, clearAuthSession, setAuthReady } from '../store/slices/userSlice';
import { upsertAccountFromSession } from '../accounts/accountsStorage';

/** App ochilganda httpOnly cookie orqali sessiyani tiklaydi */
const AuthSessionBootstrap = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchMe();
        if (cancelled) return;
        if (data?.user) {
          dispatch(setAuthSession({ user: data.user }));
          upsertAccountFromSession(data.user);
        } else {
          dispatch(clearAuthSession());
        }
      } catch {
        if (!cancelled) {
          dispatch(setAuthReady(true));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return null;
};

export default AuthSessionBootstrap;
