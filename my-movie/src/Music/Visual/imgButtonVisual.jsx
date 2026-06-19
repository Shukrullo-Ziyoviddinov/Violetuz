import React, { useEffect, useRef } from 'react';
import styles from './imgButtonVisual.module.css';

const BAR_WIDTH = 5;
const GAP = 3;
const BARS_PER_SIDE = 18;

const ImgButtonVisual = ({ analyserRef, isPlaying, audioGraphReady }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const dataArrayRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const w = Math.floor(container.clientWidth) || 480;
      const h = 48;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const analyser = analyserRef?.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;

    if (!dataArrayRef.current) {
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
    const dataArray = dataArrayRef.current;
    const bufferLength = dataArray.length;

    const runDraw = () => {
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const barStep = BAR_WIDTH + GAP;
      const barCount = Math.floor(width / barStep);
      const halfCount = Math.floor(barCount / 2);
      const maxBarHeight = height * 0.9;

      let values = [];
      if (isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        for (let i = 0; i <= halfCount; i++) {
          const idx = Math.floor((i / halfCount) * bufferLength);
          values.push((dataArray[idx] || 0) / 255);
        }
      } else {
        for (let i = 0; i <= halfCount; i++) {
          values.push(0.15);
        }
      }

      const color = 'rgba(255, 255, 255, 0.9)';

      for (let i = 0; i < barCount; i++) {
        const mirrorIdx = i < halfCount ? i : barCount - 1 - i;
        const val = values[Math.min(mirrorIdx, values.length - 1)] ?? 0.15;
        const barHeight = val * maxBarHeight;
        const x = i * barStep;
        ctx.fillStyle = color;
        ctx.fillRect(x, height - barHeight, BAR_WIDTH, barHeight);
      }

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(runDraw);
      }
    };

    runDraw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyserRef, isPlaying, audioGraphReady]);

  return (
    <div ref={containerRef} className={styles.visual} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={480}
        height={48}
      />
    </div>
  );
};

export default ImgButtonVisual;
