import React, { useEffect, useRef } from 'react';
import styles from './AudioVisualizerCanvas.module.css';

const BAR_COUNT = 18;

const AudioVisualizerCanvas = ({ analyserRef, isPlaying, audioGraphReady }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const dataArrayRef = useRef(null);

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
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      const barWidth = Math.max(2, width / BAR_COUNT - 3);
      const gap = 3;
      const maxBarHeight = height * 0.45;

      let values = [];
      if (isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        for (let i = 0; i < BAR_COUNT; i++) {
          const idx = Math.floor((i / BAR_COUNT) * bufferLength);
          values.push((dataArray[idx] || 0) / 255);
        }
      } else {
        for (let i = 0; i < BAR_COUNT; i++) {
          values.push(0.2);
        }
      }

      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#0d1df4');
      gradient.addColorStop(0.5, '#202ef1');
      gradient.addColorStop(1, '#0d1df4');

      for (let i = 0; i < BAR_COUNT; i++) {
        const val = values[i];
        const barHeight = val * maxBarHeight;
        const x = i * (barWidth + gap);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, centerY - barHeight, barWidth, barHeight * 2);
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
    <div className={styles.visualizer}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={200}
        height={44}
        aria-hidden="true"
      />
    </div>
  );
};

export default AudioVisualizerCanvas;
