import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_MAX_MS = 40_000;
const DEFAULT_MIN_MS = 2_000;
const DEFAULT_SNAPSHOT_INTERVAL_MS = 3_500;
const DEFAULT_FIRST_SNAPSHOT_MS = 4_000;

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

/**
 * @param {object} options
 * @param {boolean} [options.enabled]
 * @param {number} [options.minMs] — foydalanuvchi to‘xtata oladigan minimal vaqt
 * @param {number} [options.maxMs] — maksimal tinglash (default 40s)
 * @param {boolean} [options.rawAudio]
 * @param {(blob: Blob|null) => void} [options.onComplete] — yozuv tugaganda (max yoki manual stop)
 * @param {(blob: Blob) => void} [options.onSnapshot] — tinglash davomida davriy probe
 * @param {number} [options.snapshotIntervalMs]
 * @param {number} [options.firstSnapshotMs] — birinchi probe qachon
 */
const useAudioRecorder = ({
  enabled = true,
  minMs = DEFAULT_MIN_MS,
  maxMs = DEFAULT_MAX_MS,
  onComplete,
  onSnapshot,
  snapshotIntervalMs = DEFAULT_SNAPSHOT_INTERVAL_MS,
  firstSnapshotMs = DEFAULT_FIRST_SNAPSHOT_MS,
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
  const mimeTypeRef = useRef('audio/webm');
  const stopTimerRef = useRef(null);
  const tickTimerRef = useRef(null);
  const snapshotTimerRef = useRef(null);
  const firstSnapshotTimerRef = useRef(null);
  const meterCleanupRef = useRef(null);
  const startedAtRef = useRef(0);
  const peakRef = useRef(0);
  const resolveRef = useRef(null);
  const skipCompleteRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onSnapshotRef = useRef(onSnapshot);
  onCompleteRef.current = onComplete;
  onSnapshotRef.current = onSnapshot;

  const buildBlob = useCallback(() => {
    if (!chunksRef.current.length) return null;
    const blob = new Blob(chunksRef.current, {
      type: mimeTypeRef.current || 'audio/webm',
    });
    return blob.size > 0 ? blob : null;
  }, []);

  const emitSnapshot = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;
    if (typeof recorder.requestData === 'function') {
      recorder.requestData();
    }
    // requestData async chunk beradi — keyingi tickda o‘qiymiz
    window.setTimeout(() => {
      if (!recorderRef.current || recorderRef.current.state !== 'recording') return;
      const blob = buildBlob();
      if (blob) onSnapshotRef.current?.(blob);
    }, 80);
  }, [buildBlob]);

  const cleanupStream = useCallback(() => {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (tickTimerRef.current) {
      window.clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    if (snapshotTimerRef.current) {
      window.clearInterval(snapshotTimerRef.current);
      snapshotTimerRef.current = null;
    }
    if (firstSnapshotTimerRef.current) {
      window.clearTimeout(firstSnapshotTimerRef.current);
      firstSnapshotTimerRef.current = null;
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
    skipCompleteRef.current = true;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.onstop = null;
        recorder.stop();
      } catch {
        /* ignore */
      }
    }
    cleanupStream();
    setRecording(false);
    setElapsedMs(0);
    setCanStop(false);
    setMicLevel(0);
    setPeakMicLevel(0);
    setError(null);
    resolveRef.current = null;
    skipCompleteRef.current = false;
  }, [cleanupStream]);

  const stop = useCallback(
    ({ skipComplete = false } = {}) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        return Promise.resolve(null);
      }

      const elapsed = Date.now() - (startedAtRef.current || Date.now());
      if (!skipComplete && elapsed < minMs) {
        return Promise.resolve(null);
      }

      skipCompleteRef.current = Boolean(skipComplete);

      return new Promise((resolve) => {
        resolveRef.current = resolve;
        if (typeof recorder.requestData === 'function') {
          recorder.requestData();
        }
        recorder.stop();
      });
    },
    [minMs]
  );

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
      skipCompleteRef.current = false;
      setPeakMicLevel(0);

      meterCleanupRef.current = attachMicMeter(stream, (level) => {
        setMicLevel(level);
        if (level > peakRef.current) {
          peakRef.current = level;
          setPeakMicLevel(level);
        }
      });

      const mimeType = pickMimeType();
      mimeTypeRef.current = mimeType || 'audio/webm';
      const recorderOptions = mimeType
        ? { mimeType, audioBitsPerSecond: 128_000 }
        : { audioBitsPerSecond: 128_000 };
      const recorder = new MediaRecorder(stream, recorderOptions);

      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data?.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = buildBlob();
        const skipComplete = skipCompleteRef.current;
        skipCompleteRef.current = false;
        cleanupStream();
        setRecording(false);
        setElapsedMs(0);
        setCanStop(false);
        setMicLevel(0);
        const resolve = resolveRef.current;
        resolveRef.current = null;
        resolve?.(blob);
        if (!skipComplete) {
          onCompleteRef.current?.(blob);
        }
      };

      recorder.onerror = () => {
        setError({ error: 'recorder-failed' });
        abort();
      };

      // timeslice: davriy chunk + snapshot uchun; iOS da fallback
      try {
        recorder.start(1000);
      } catch {
        try {
          recorder.start();
        } catch {
          recorder.start(250);
        }
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

      if (onSnapshotRef.current) {
        const firstDelay = Math.max(0, firstSnapshotMs);
        firstSnapshotTimerRef.current = window.setTimeout(() => {
          firstSnapshotTimerRef.current = null;
          if (!recorderRef.current || recorderRef.current.state !== 'recording') return;
          emitSnapshot();
          snapshotTimerRef.current = window.setInterval(() => {
            emitSnapshot();
          }, snapshotIntervalMs);
        }, firstDelay);
      }

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
  }, [
    enabled,
    abort,
    cleanupStream,
    maxMs,
    minMs,
    stop,
    rawAudio,
    buildBlob,
    emitSnapshot,
    firstSnapshotMs,
    snapshotIntervalMs,
  ]);

  useEffect(() => {
    if (!enabled) abort();
    return () => abort();
  }, [enabled, abort]);

  const remainingSec = Math.max(0, Math.ceil((maxMs - elapsedMs) / 1000));

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
