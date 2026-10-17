import { useCallback, useEffect, useRef } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectAuthReady, selectIsLoggedIn } from '../store/slices/userSlice';
import { saveTrillerWatchPercent } from '../api/trillerProgressApi';
import { nextTrillerSample, shouldSendTrillerRate } from '../utils/trillerWatchSample';

/**
 * Parda videosining foizini yozadi.
 * Hisob: server. Mehmon: telefon. Kino bali chaqirilmaydi.
 */
export function useTrillerWatchPercent() {
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const authReadyRef = useRef(authReady);
  const isLoggedInRef = useRef(isLoggedIn);
  const samplesRef = useRef(new Map());
  const sentRef = useRef(new Map());
  const pendingIdRef = useRef(null);
  const lastIdRef = useRef(null);
  const flightRef = useRef(false);
  const queuedRef = useRef(null);

  authReadyRef.current = authReady;
  isLoggedInRef.current = isLoggedIn;

  const send = useCallback((trillerId, rate) => {
    const id = Number(trillerId);
    if (!Number.isInteger(id) || id <= 0) return;
    if (!authReadyRef.current) {
      pendingIdRef.current = id;
      return;
    }
    if (flightRef.current) {
      queuedRef.current = { id, rate };
      return;
    }

    const sample = samplesRef.current.get(id);
    const previousSent = sentRef.current.get(id) || 0;
    sentRef.current.set(id, rate);
    flightRef.current = true;
    Promise.resolve(saveTrillerWatchPercent({
      trillerId: id,
      completionRate: rate,
      watchedSeconds: sample?.high,
      durationSec: sample?.duration,
      isLoggedIn: isLoggedInRef.current,
    }))
      .catch(() => {
        if (sentRef.current.get(id) === rate) sentRef.current.set(id, previousSent);
      })
      .finally(() => {
        flightRef.current = false;
        const queued = queuedRef.current;
        queuedRef.current = null;
        if (!queued) return;
        const last = sentRef.current.get(queued.id) || 0;
        if (queued.rate > last + 1e-9) send(queued.id, queued.rate);
      });
  }, []);

  const note = useCallback((trillerId, currentTime, durationSec, { force = false } = {}) => {
    const id = Number(trillerId);
    if (!Number.isInteger(id) || id <= 0) return;
    const sample = nextTrillerSample(samplesRef.current.get(id), currentTime, durationSec);
    if (!sample) return;
    samplesRef.current.set(id, sample);
    lastIdRef.current = id;
    if (!shouldSendTrillerRate(sentRef.current.get(id) || 0, sample.rate, force)) return;
    send(id, sample.rate);
  }, [send]);

  const flush = useCallback((trillerId) => {
    const id = Number(trillerId);
    const sample = samplesRef.current.get(id);
    if (!sample) return;
    if (!shouldSendTrillerRate(sentRef.current.get(id) || 0, sample.rate, true)) return;
    send(id, sample.rate);
  }, [send]);

  useEffect(() => {
    if (!authReady) return;
    const id = pendingIdRef.current;
    pendingIdRef.current = null;
    if (id != null) flush(id);
  }, [authReady, isLoggedIn, flush]);

  useEffect(() => {
    const leave = () => {
      if (document.visibilityState === 'hidden') flush(lastIdRef.current);
    };
    const pageHide = () => flush(lastIdRef.current);
    document.addEventListener('visibilitychange', leave);
    window.addEventListener('pagehide', pageHide);
    return () => {
      document.removeEventListener('visibilitychange', leave);
      window.removeEventListener('pagehide', pageHide);
    };
  }, [flush]);

  return { note, flush };
}
