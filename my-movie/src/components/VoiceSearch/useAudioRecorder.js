import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_MAX_MS = 12_000;
const DEFAULT_MIN_MS = 7_000;

const pickMimeType = () => {
  if (typeof window === 'undefined' || !window.MediaRecorder) return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
};

/** Tarona: AEC o‘chiriladi, AGC yoqiladi — past mikrofon signalini kuchaytiradi */
const TARONA_AUDIO_CONSTRAINTS = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: true,
  googEchoCancellation: false,
  googNoiseSuppression: false,
  googAutoGainControl: true,
};

/**
 * Mikrofon orqali qisqa audio yozish (Tarona / Shazam).
 */
const useAudioRecorder = ({
  enabled = true,
  minMs = DEFAULT_MIN_MS,
  maxMs = DEFAULT_MAX_MS,
  onComplete,
  rawAudio = false,
} = {}) => {
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [canStop, setCanStop] = useState(false);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const stopTimerRef = useRef(null);
  const tickTimerRef = useRef(null);
  const startedAtRef = useRef(0);
  const resolveRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const cleanupStream = useCallback(() => {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (tickTimerRef.current) {
      window.clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
    chunksRef.current = [];
    startedAtRef.current = 0;
  }, []);

  const abort = useCallback(() => {
    cleanupStream();
    setRecording(false);
    setElapsedMs(0);
    setCanStop(false);
    setError(null);
    resolveRef.current = null;
  }, [cleanupStream]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      return Promise.resolve(null);
    }

    const elapsed = Date.now() - (startedAtRef.current || Date.now());
    if (elapsed < minMs) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      resolveRef.current = resolve;
      recorder.stop();
    });
  }, [minMs]);

  const start = useCallback(async () => {
    if (!enabled) return null;
    abort();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: rawAudio
          ? TARONA_AUDIO_CONSTRAINTS
          : {
              echoCancellation: true,
              noiseSuppression: true,
            },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data?.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || 'audio/webm',
        });
        cleanupStream();
        setRecording(false);
        setElapsedMs(0);
        setCanStop(false);
        const result = blob.size > 0 ? blob : null;
        const resolve = resolveRef.current;
        resolveRef.current = null;
        resolve?.(result);
        onCompleteRef.current?.(result);
      };

      recorder.onerror = () => {
        setError({ error: 'recorder-failed' });
        abort();
      };

      recorder.start(250);
      startedAtRef.current = Date.now();
      setRecording(true);
      setElapsedMs(0);
      setCanStop(false);
      setError(null);

      tickTimerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startedAtRef.current;
        setElapsedMs(elapsed);
        if (elapsed >= minMs) {
          setCanStop(true);
        }
      }, 200);

      stopTimerRef.current = window.setTimeout(() => {
        stop();
      }, maxMs);

      return true;
    } catch (err) {
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError({ error: 'not-allowed' });
      } else {
        setError({ error: 'not-supported' });
      }
      abort();
      return null;
    }
  }, [enabled, abort, cleanupStream, maxMs, minMs, stop, rawAudio]);

  useEffect(() => {
    if (!enabled) abort();
    return () => abort();
  }, [enabled, abort]);

  const remainingSec = Math.max(0, Math.ceil((minMs - elapsedMs) / 1000));

  return {
    recording,
    elapsedMs,
    remainingSec,
    canStop,
    error,
    start,
    stop,
    abort,
  };
};

export default useAudioRecorder;
