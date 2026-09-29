import { useEffect, useState } from 'react';
import { fetchMixShare } from '../api/musicMixApi';

/**
 * Share token (?ms=) bo'yicha snapshot.
 * Public o'qish — login shart emas. Bazaga yozilmaydi.
 *
 * @param {{ token?: string, enabled?: boolean }} [opts]
 * @returns {{
 *   share: {
 *     token: string,
 *     contentType: string,
 *     genre: string,
 *     leadId: string,
 *     coverImg: string,
 *     tracks: Array<{ contentId: string, position: number }>,
 *     expiresAt?: string,
 *   }|null,
 *   isLoading: boolean,
 *   error: boolean,
 * }}
 */
export function useSharedMix({ token = '', enabled = true } = {}) {
  const key = String(token || '').trim();
  const active = Boolean(enabled && key);
  const [share, setShare] = useState(null);
  const [isLoading, setIsLoading] = useState(active);
  const [error, setError] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!active) {
      setShare(null);
      setIsLoading(false);
      setError(false);
      setExpired(false);
      return undefined;
    }

    setIsLoading(true);
    setError(false);
    setExpired(false);
    fetchMixShare(key)
      .then((data) => {
        if (cancelled) return;
        const tracks = Array.isArray(data?.tracks) ? data.tracks : [];
        if (!data || !tracks.length) {
          setShare(null);
          setError(true);
          return;
        }
        setShare({
          token: String(data.token || key),
          contentType: String(data.contentType || 'music').trim().toLowerCase() || 'music',
          genre: String(data.genre || '').trim(),
          leadId: String(data.leadId || '').trim(),
          coverImg: String(data.coverImg || '').trim(),
          tracks,
          expiresAt: data.expiresAt || null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setShare(null);
        setError(true);
        setExpired(Number(err?.status) === 404 || Number(err?.status) === 410);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [active, key]);

  return { share, isLoading, error, expired };
}
