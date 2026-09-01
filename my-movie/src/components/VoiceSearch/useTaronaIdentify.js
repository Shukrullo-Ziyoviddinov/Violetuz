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

  const reset = useCallback(() => {
    setPhase(PHASE_IDLE);
    setMatches([]);
    setError(null);
    setRejectReason(null);
    setLastMeta(null);
  }, []);

  const identify = useCallback(async (audioBlob) => {
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

  return {
    phase,
    matches,
    error,
    rejectReason,
    lastMeta,
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
