import { useCallback, useRef, useState } from 'react';
import { identifyMusicFromAudio } from './identifyApi';

const PHASE_IDLE = 'idle';
const PHASE_RECORDING = 'recording';
const PHASE_PROCESSING = 'processing';
const PHASE_DONE = 'done';
const PHASE_ERROR = 'error';

const useTaronaIdentify = () => {
  const [phase, setPhase] = useState(PHASE_IDLE);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);
  const [rejectReason, setRejectReason] = useState(null);
  const [lastMeta, setLastMeta] = useState(null);
  const [probing, setProbing] = useState(false);
  const probeInFlightRef = useRef(false);
  const matchedRef = useRef(false);

  const reset = useCallback(() => {
    probeInFlightRef.current = false;
    matchedRef.current = false;
    setPhase(PHASE_IDLE);
    setMatches([]);
    setError(null);
    setRejectReason(null);
    setLastMeta(null);
    setProbing(false);
  }, []);

  /**
   * Tinglash davomida: topilsa true, topilmasa false (tinglash davom etadi).
   * Parallel probelar bloklanadi.
   */
  const probe = useCallback(async (audioBlob) => {
    if (matchedRef.current) return true;
    if (probeInFlightRef.current) return false;
    if (!audioBlob?.size || audioBlob.size < 4000) return false;

    probeInFlightRef.current = true;
    setProbing(true);

    try {
      const { matches: found, meta } = await identifyMusicFromAudio(audioBlob);
      setLastMeta(meta);

      if (found?.length) {
        matchedRef.current = true;
        setMatches(found);
        setRejectReason(null);
        setError(null);
        setPhase(PHASE_DONE);
        return true;
      }
      return false;
    } catch {
      // Tarmoq xatosida tinglashni to‘xtatmaymiz — keyingi probe urinib ko‘radi
      return false;
    } finally {
      probeInFlightRef.current = false;
      setProbing(false);
    }
  }, []);

  /** Max vaqt tugaganda yoki foydalanuvchi to‘xtatganda — oxirgi urinish */
  const finalize = useCallback(async (audioBlob) => {
    if (matchedRef.current) return;

    if (!audioBlob?.size || audioBlob.size < 8000) {
      setError({ message: 'empty-audio' });
      setRejectReason(null);
      setLastMeta(null);
      setPhase(PHASE_ERROR);
      return;
    }

    setPhase(PHASE_PROCESSING);
    setError(null);
    setRejectReason(null);
    setMatches([]);

    try {
      const { matches: found, meta } = await identifyMusicFromAudio(audioBlob);
      setMatches(found);
      setLastMeta(meta);
      setRejectReason(found.length ? null : meta?.rejectedReason || 'no_confident_match');
      if (found.length) matchedRef.current = true;
      setPhase(PHASE_DONE);
    } catch (err) {
      const msg = String(err?.message || '');
      const isNetwork =
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('Load failed') ||
        msg === 'network-error';

      setError({ message: isNetwork ? 'network-error' : msg || 'identify-failed' });
      setRejectReason(null);
      setPhase(PHASE_ERROR);
    }
  }, []);

  /** Orqaga moslik */
  const identify = finalize;

  return {
    phase,
    matches,
    error,
    rejectReason,
    lastMeta,
    probing,
    matchedRef,
    probe,
    finalize,
    identify,
    reset,
    PHASE_IDLE,
    PHASE_RECORDING,
    PHASE_PROCESSING,
    PHASE_DONE,
    PHASE_ERROR,
  };
};

export default useTaronaIdentify;
