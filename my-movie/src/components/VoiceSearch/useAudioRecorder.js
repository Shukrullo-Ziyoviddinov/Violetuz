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

/** Tarona: AEC o‘chiriladi, AGC yoqiladi */
const TARONA_AUDIO_CONSTRAINTS = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: true,
  googEchoCancellation: false,
  googNoiseSuppression: false,
  googAutoGainControl: true,
};

const attachMicMeter = (stream, onLevel) => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return () => {};

  const ctx = new AudioCtx();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.35;
  source.connect(analyser);

  const data = new Uint8Array(analyser.fftSize);
  let rafId = 0;

  const tick = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    onLevel(Math.sqrt(sum / data.length));
    rafId = window.requestAnimationFrame(tick);
  };

  tick();

  return () => {
    if (rafId) window.cancelAnimationFrame(rafId);
    source.disconnect();
    analyser.disconnect();
    ctx.close().catch(() => {});
  };
};

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
  const [micLevel, setMicLevel] = useState(0);
  const [peakMicLevel, setPeakMicLevel] = useState(0);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const stopTimerRef = useRef(null);
  const tickTimerRef = useRef(null);
  const meterCleanupRef = useRef(null);
  const startedAtRef = useRef(0);
  const peakRef = useRef(0);
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
    if (meterCleanupRef.current) {
      meterCleanupRef.current();
      meterCleanupRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
    chunksRef.current = [];
    startedAtRef.current = 0;
    peakRef.current = 0;
  }, []);

  const abort = useCallback(() => {
    cleanupStream();
    setRecording(false);
    setElapsedMs(0);
    setCanStop(false);
    setMicLevel(0);
    setPeakMicLevel(0);
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
      if (typeof recorder.requestData === 'function') {
        recorder.requestData();
      }
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
      peakRef.current = 0;
      setPeakMicLevel(0);

      meterCleanupRef.current = attachMicMeter(stream, (level) => {
        setMicLevel(level);
        if (level > peakRef.current) {
          peakRef.current = level;
          setPeakMicLevel(level);
        }
      });

      const mimeType = pickMimeType();
      const recorderOptions = mimeType
        ? { mimeType, audioBitsPerSecond: 128_000 }
        : { audioBitsPerSecond: 128_000 };
      const recorder = new MediaRecorder(stream, recorderOptions);

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
        setMicLevel(0);
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

      // iOS Safari timeslice bilan bo‘sh/buzilgan blob berishi mumkin — timeslicesiz yozamiz
      try {
        recorder.start();
      } catch {
        recorder.start(250);
      }
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
    micLevel,
    peakMicLevel,
    error,
    start,
    stop,
    abort,
  };
};

export default useAudioRecorder;
