import { useCallback, useState } from 'react';
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

  const reset = useCallback(() => {
    setPhase(PHASE_IDLE);
    setMatches([]);
    setError(null);
    setRejectReason(null);
  }, []);

  const identify = useCallback(async (audioBlob) => {
    if (!audioBlob?.size) {
      setError({ message: 'empty-audio' });
      setRejectReason(null);
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
      setRejectReason(found.length ? null : meta?.rejectedReason || 'no_confident_match');
      setPhase(PHASE_DONE);
      if (!found.length && meta?.bestScore != null) {
        // eslint-disable-next-line no-console
        console.info('[tarona] no match', meta);
      }
    } catch (err) {
      const msg = String(err?.message || '');
      const isNetwork =
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('Load failed');

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
