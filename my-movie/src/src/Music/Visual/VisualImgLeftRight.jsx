import React, { useEffect, useRef, useState } from 'react';
import styles from './VisualImgLeftRight.module.css';

const BAR_COUNT = 8;

const drawBars = (ctx, width, height, values, color) => {
  const centerY = height / 2;
  const barWidth = Math.max(2, width / BAR_COUNT - 2);
  const gap = 2;
  const maxBarHeight = height * 0.4;

  for (let i = 0; i < BAR_COUNT; i++) {
    const val = values[i];
    const barHeight = val * maxBarHeight;
    const x = i * (barWidth + gap);

    ctx.fillStyle = color;
    ctx.fillRect(x, centerY - barHeight, barWidth, barHeight * 2);
  }
};

const VisualImgLeftRight = ({ audioRef, isPlaying, children }) => {
  const leftCanvasRef = useRef(null);
  const rightCanvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = audioRef?.current;
    if (!el || !el.src) return;

    try {
      const ctx = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)();
      if (!audioContextRef.current) audioContextRef.current = ctx;

      if (!sourceNodeRef.current) {
        const source = ctx.createMediaElementSource(el);
        sourceNodeRef.current = source;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        analyserRef.current = analyser;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        setReady(true);
      }
    } catch (e) {
      console.warn('VisualImgLeftRight: Web Audio API not available', e);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [audioRef]);

  useEffect(() => {
    const analyser = analyserRef.current;
    const leftCanvas = leftCanvasRef.current;
    const rightCanvas = rightCanvasRef.current;
    if (!analyser || !leftCanvas || !rightCanvas || !ready) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const bufferLength = dataArray.length;
    const color = 'rgba(220, 38, 38, 0.9)';

    const runDraw = () => {
      const values = [];
      if (isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        for (let i = 0; i < BAR_COUNT; i++) {
          const idx = Math.floor((i / BAR_COUNT) * bufferLength);
          values.push((dataArray[idx] || 0) / 255);
        }
      } else {
        for (let i = 0; i < BAR_COUNT; i++) values.push(0.15);
      }

      const w = leftCanvas.width;
      const h = leftCanvas.height;

      const leftCtx = leftCanvas.getContext('2d');
      leftCtx.clearRect(0, 0, w, h);
      leftCtx.save();
      leftCtx.translate(w, 0);
      leftCtx.scale(-1, 1);
      drawBars(leftCtx, w, h, values, color);
      leftCtx.restore();

      const rightCtx = rightCanvas.getContext('2d');
      rightCtx.clearRect(0, 0, w, h);
      drawBars(rightCtx, w, h, values, color);

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(runDraw);
      }
    };

    runDraw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [ready, isPlaying]);

  return (
    <>
      <div className={styles.wrap} aria-hidden="true">
        <canvas
          ref={leftCanvasRef}
          className={styles.canvas}
          width={60}
          height={180}
        />
      </div>
      {children}
      <div className={styles.wrap} aria-hidden="true">
        <canvas
          ref={rightCanvasRef}
          className={styles.canvas}
          width={60}
          height={180}
        />
      </div>
    </>
  );
};

export default VisualImgLeftRight;
