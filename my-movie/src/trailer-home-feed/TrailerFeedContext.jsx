import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectAuthReady, selectIsLoggedIn, selectProfile } from '../store/slices/userSlice';
import { fetchTrailerFeedPage } from './feedApi';

const TrailerFeedContext = createContext(null);
export function TrailerFeedProvider({ children }) {
  const { pathname } = useLocation();
  const enabled = pathname === '/' || pathname === '/recommended/trailers';
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const accountId = useAppSelector(selectProfile)?.id;
  const viewer = authReady ? (isLoggedIn ? `account:${accountId}` : 'guest') : null;
  const [result, setResult] = useState(null);
  const [epoch, setEpoch] = useState(0);
  const generation = useRef(0);
  const controller = useRef(null);
  const busy = useRef(false);
  useEffect(() => {
    const token = ++generation.current;
    setResult(null);
    busy.current = false;
    if (!enabled || !authReady) return undefined;
    const abort = new AbortController();
    controller.current = abort;
    busy.current = true;
    fetchTrailerFeedPage({ isLoggedIn, signal: abort.signal }).then((page) => {
      if (!abort.signal.aborted && generation.current === token) setResult({ ...page, viewer, loading: false, error: null });
    }).catch((error) => {
      if (!abort.signal.aborted && generation.current === token) setResult({ viewer, items: [], nextCursor: null, loading: false, error });
    }).finally(() => { if (generation.current === token) busy.current = false; });
    return () => abort.abort();
  }, [enabled, authReady, isLoggedIn, viewer, epoch]);
  const loadMore = useCallback(async () => {
    if (busy.current || !result?.nextCursor || result.viewer !== viewer) return;
    const token = generation.current;
    const signal = controller.current?.signal;
    busy.current = true;
    setResult((old) => ({ ...old, loading: true, error: null }));
    try {
      const page = await fetchTrailerFeedPage({ isLoggedIn, signal, cursor: result.nextCursor });
      if (signal?.aborted || generation.current !== token) return;
      setResult((old) => {
        const seen = new Set(old.items.map((item) => item.key));
        return { ...old, nextCursor: page.nextCursor, loading: false, error: null,
          items: [...old.items, ...page.items.filter((item) => { if (seen.has(item.key)) return false; seen.add(item.key); return true; })] };
      });
    } catch (error) {
      if (!signal?.aborted && generation.current === token) setResult((old) => ({ ...old, loading: false, error }));
    } finally { if (generation.current === token) busy.current = false; }
  }, [result, viewer, isLoggedIn]);
  const ready = authReady && result?.viewer === viewer;
  return <TrailerFeedContext.Provider value={{ items: ready ? result.items : [], ready,
    loading: !ready || result.loading, nextCursor: ready ? result.nextCursor : null,
    error: ready ? result.error : null, loadMore, refresh: () => setEpoch((value) => value + 1) }}>
    {children}
  </TrailerFeedContext.Provider>;
}
export function useTrailerFeed() {
  const value = useContext(TrailerFeedContext);
  if (!value) throw new Error('TrailerFeedProvider is required');
  return value;
}
