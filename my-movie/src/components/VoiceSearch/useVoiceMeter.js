import { useEffect, useRef, useState } from 'react';

const SPEAK_THRESHOLD = 0.06;

/**
 * Mikrofon ochiq bo‘lganda ovoz darajasini o‘qiydi (visual uchun).
 * Search/STT ga tegmaydi.
 */
export default function useVoiceMeter(active) {
  const [level, setLevel] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const rafRef = useRef(0);
  const streamRef = useRef(null);
  const ctxRef = useRef(null);

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (ctxRef.current) {
        ctxRef.current.close?.().catch?.(() => {});
        ctxRef.current = null;
      }
      setLevel(0);
      setSpeaking(false);
      return undefined;
    }

    let cancelled = false;

    const run = async () => {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
          video: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        ctxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (cancelled) return;
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i += 1) sum += data[i];
          const avg = sum / (data.length * 255);
          const next = Math.min(1, avg * 2.2);
          setLevel(next);
          setSpeaking(next >= SPEAK_THRESHOLD);
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        setLevel(0);
        setSpeaking(false);
      }
    };

    run();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (ctxRef.current) {
        ctxRef.current.close?.().catch?.(() => {});
        ctxRef.current = null;
      }
    };
  }, [active]);

  return { level, speaking };
}
