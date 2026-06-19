
import React, { useEffect, useRef } from 'react';
import styles from './cardVisual.module.css';

const BAR_COUNT = 4;
const BAR_W = 3;
const GAP = 3;
const CW = BAR_COUNT * (BAR_W + GAP) - GAP;
const CH = 16;

const CardVisual = ({ analyserRef, isPlaying, audioGraphReady }) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const smoothRef = useRef([0.12, 0.12, 0.12, 0.12]);
  const phasesRef = useRef([0.0, 0.9, 1.8, 2.7]);
  const noiseRef = useRef([0, 0, 0, 0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CW;
    canvas.height = CH;

    const analyser = analyserRef?.current;
    let dataArray = null;
    if (analyser) {
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    }

    const draw = () => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, CW, CH);
      ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';

      const smooth = smoothRef.current;
      const step = BAR_W + GAP;
      const maxBH = CH * 0.88;

      for (let i = 0; i < BAR_COUNT; i++) {
        const bh = Math.max(2, smooth[i] * maxBH);
        const x = i * step;
        const y = CH - bh;
        const r = 1;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + BAR_W - r, y);
        ctx.quadraticCurveTo(x + BAR_W, y, x + BAR_W, y + r);
        ctx.lineTo(x + BAR_W, CH);
        ctx.lineTo(x, CH);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
      }
    };

    const tickPlaying = () => {
      const smooth = smoothRef.current;
      const analyserNow = analyserRef?.current;

      if (analyserNow && dataArray) {
        analyserNow.getByteFrequencyData(dataArray);
        const half = Math.ceil(BAR_COUNT / 2);
        for (let i = 0; i < half; i++) {
          const s = Math.floor((i / half) * dataArray.length * 0.5);
          const e = Math.floor(((i + 1) / half) * dataArray.length * 0.5);
          const size = Math.max(1, e - s);
          let sum = 0;
          for (let j = s; j < e; j++) sum += dataArray[j];
          const target = sum / size / 255;
          smooth[i] += (Math.max(0.09, target) - smooth[i]) * 0.55;
          smooth[BAR_COUNT - 1 - i] = smooth[i];
        }
      } else {
        // analyser yo'q bo'lsa soxta animatsiya
        const phases = phasesRef.current;
        const noises = noiseRef.current;
        const amps = [0.50, 0.82, 0.82, 0.50];
        const speeds = [0.055, 0.082, 0.068, 0.095];
        for (let i = 0; i < BAR_COUNT; i++) {
          phases[i] += speeds[i];
          noises[i] = noises[i] * 0.82 + (Math.random() - 0.5) * 0.07;
          const target = amps[i] * (0.45 + 0.55 * Math.abs(Math.sin(phases[i]))) + noises[i];
          smooth[i] += (Math.max(0.05, Math.min(1, target)) - smooth[i]) * 0.20;
        }
      }

      draw();
      rafRef.current = requestAnimationFrame(tickPlaying);
    };

    const tickIdle = () => {
      const smooth = smoothRef.current;
      let allSteady = true;
      for (let i = 0; i < BAR_COUNT; i++) {
        smooth[i] += (0.12 - smooth[i]) * 0.12;
        if (Math.abs(smooth[i] - 0.12) > 0.002) allSteady = false;
      }
      draw();
      if (!allSteady) rafRef.current = requestAnimationFrame(tickIdle);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (isPlaying) {
      tickPlaying();
    } else {
      tickIdle();
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, audioGraphReady]);

  return (
    <div className={styles.wrap} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
};

export default CardVisual;