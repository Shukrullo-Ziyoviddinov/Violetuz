import { useCallback, useState } from 'react';
import { identifyMusicFromAudio } from './identifyApi';
import { analyzeAudioBlobRms, isTaronaAudioLoudEnough } from './taronaAudioLevel';

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
      const rms = await analyzeAudioBlobRms(audioBlob);
      if (!isTaronaAudioLoudEnough(rms)) {
        setError({ message: 'audio-too-quiet' });
        setPhase(PHASE_DONE);
        return;
      }

      const { matches: found, meta } = await identifyMusicFromAudio(audioBlob);
      setMatches(found);

      if (!found.length && meta?.rejectedReason) {
        setError({ message: meta.rejectedReason });
      }

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
