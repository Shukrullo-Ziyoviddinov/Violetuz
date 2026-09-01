import { useCallback, useRef, useState } from 'react';
import { identifyMusicFromAudio } from './identifyApi';

const PHASE_IDLE = 'idle';
const PHASE_RECORDING = 'recording';
const PHASE_PROCESSING = 'processing';
const PHASE_DONE = 'done';
const PHASE_ERROR = 'error';

/** Server qabul qilgan match — client faqat aniq past ballni rad etadi */
const MIN_CLIENT_MATCH_SCORE = 0.66;

const isConfidentMatch = (matches, meta) =>
  Boolean(matches?.length) && Number(meta?.bestScore) >= MIN_CLIENT_MATCH_SCORE;

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

  const probe = useCallback(async (audioBlob) => {
    if (matchedRef.current) return true;
    if (probeInFlightRef.current) return false;
    if (!audioBlob?.size || audioBlob.size < 4000) return false;

    probeInFlightRef.current = true;
    setProbing(true);

    try {
      const { matches: found, meta } = await identifyMusicFromAudio(audioBlob);
      setLastMeta(meta);

      if (isConfidentMatch(found, meta)) {
        matchedRef.current = true;
        setMatches(found);
        setRejectReason(null);
        setError(null);
        setPhase(PHASE_DONE);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      probeInFlightRef.current = false;
      setProbing(false);
    }
  }, []);

  const finalize = useCallback(async (audioBlob, { reason: localReason } = {}) => {
    if (matchedRef.current) return;

    if (localReason === 'no-audio-detected') {
      setMatches([]);
      setRejectReason('audio_too_quiet');
      setLastMeta(null);
      setError(null);
      setPhase(PHASE_DONE);
      return;
    }

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
      setLastMeta(meta);

      if (isConfidentMatch(found, meta)) {
        setMatches(found);
        setRejectReason(null);
        matchedRef.current = true;
      } else {
        setMatches([]);
        setRejectReason(meta?.rejectedReason || 'no_confident_match');
      }
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
