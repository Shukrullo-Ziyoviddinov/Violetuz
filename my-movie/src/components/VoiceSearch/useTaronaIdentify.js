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

  const reset = useCallback(() => {
    setPhase(PHASE_IDLE);
    setMatches([]);
    setError(null);
  }, []);

  const identify = useCallback(async (audioBlob) => {
    if (!audioBlob?.size) {
      setError({ message: 'empty-audio' });
      setPhase(PHASE_ERROR);
      return;
    }

    setPhase(PHASE_PROCESSING);
    setError(null);
    setMatches([]);

    try {
      const { matches: found } = await identifyMusicFromAudio(audioBlob);
      setMatches(found);
      setPhase(PHASE_DONE);
    } catch (err) {
      setError({ message: err?.message || 'identify-failed' });
      setPhase(PHASE_ERROR);
    }
  }, []);

  return {
    phase,
    matches,
    error,
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
