import { useEffect, useRef, useState } from 'react';

const SPEAK_THRESHOLD = 0.045;

/**
 * Listening paytida mikrofonda ovoz darajasini o‘qiydi (faqat visual).
 * Recognition dan keyin ochiladi; tracklar listening tugaguncha yashaydi.
 */
export default function useVoiceMeter(active) {
  const [level, setLevel] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const rafRef = useRef(0);
  const streamRef = useRef(null);
  const ctxRef = useRef(null);
  const smoothRef = useRef(0);

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      smoothRef.current = 0;
      setLevel(0);
      setSpeaking(false);

      const stream = streamRef.current;
      streamRef.current = null;
      if (stream) {
        stream.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {
            /* ignore */
          }
        });
      }
      const ctx = ctxRef.current;
      ctxRef.current = null;
      if (ctx) {
        ctx.close?.().catch?.(() => {});
      }
      return undefined;
    }

    let cancelled = false;
    let startTimer = 0;

    const run = async () => {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) return;

        // Recognition avval mic olsin
        await new Promise((r) => {
          startTimer = window.setTimeout(r, 120);
        });
        if (cancelled) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
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
        if (ctx.state === 'suspended') {
          try {
            await ctx.resume();
          } catch {
            /* ignore */
          }
        }

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.55;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const prevSpeakRef = { current: false };
        const prevLevelRef = { current: 0 };

        const tick = () => {
          if (cancelled) return;
          analyser.getByteTimeDomainData(data);

          let sum = 0;
          for (let i = 0; i < data.length; i += 1) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          const next = Math.min(1, rms * 5.2);
          smoothRef.current = smoothRef.current * 0.4 + next * 0.6;
          const smoothed = smoothRef.current;
          const isSpeaking = smoothed >= SPEAK_THRESHOLD;

          if (
            isSpeaking !== prevSpeakRef.current ||
            Math.abs(smoothed - prevLevelRef.current) > 0.025
          ) {
            prevSpeakRef.current = isSpeaking;
            prevLevelRef.current = smoothed;
            setLevel(smoothed);
            setSpeaking(isSpeaking);
          }
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
      if (startTimer) window.clearTimeout(startTimer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      smoothRef.current = 0;
      setLevel(0);
      setSpeaking(false);

      const stream = streamRef.current;
      streamRef.current = null;
      if (stream) {
        stream.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {
            /* ignore */
          }
        });
      }
      const ctx = ctxRef.current;
      ctxRef.current = null;
      if (ctx) {
        ctx.close?.().catch?.(() => {});
      }
    };
  }, [active]);

  return { level, speaking };
}
