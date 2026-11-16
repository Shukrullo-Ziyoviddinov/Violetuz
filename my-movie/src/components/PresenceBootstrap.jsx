import { useEffect } from 'react';
import { openPresenceStream } from '../api/presenceApi';
import { useAuth } from '../context/AuthContext';

/** Hisob ochiq turgan har bir sahifada odamni onlayn qiladi. */
const PresenceBootstrap = () => {
  const { authReady, isLoggedIn, profile } = useAuth();
  const userId = String(profile?.id || '').trim();

  useEffect(() => {
    if (!authReady || !isLoggedIn || !userId) return undefined;
    const close = openPresenceStream({
      onChange: (item) => {
        window.dispatchEvent(new CustomEvent('violet-presence', { detail: item }));
      },
    });
    return close;
  }, [authReady, isLoggedIn, userId]);

  return null;
};

export default PresenceBootstrap;
