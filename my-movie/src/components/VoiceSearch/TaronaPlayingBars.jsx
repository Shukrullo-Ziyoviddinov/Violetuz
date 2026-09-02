import React, { useEffect, useRef } from 'react';

const BAR_COUNT = 4;

const TaronaPlayingBars = ({ analyserRef, isPlaying }) => {
  const wrapRef = useRef(null);

  useEffect(() => {
    const analyser = analyserRef?.current;
    const wrap = wrapRef.current;
    if (!isPlaying || !analyser || !wrap) {
      const bars = wrap?.querySelectorAll('.tarona-results-bar');
      bars?.forEach((bar) => {
        bar.style.transform = 'scaleY(0.25)';
      });
      return undefined;
    }

    const data = new Uint8Array(analyser.frequencyBinCount);
    const bars = wrap.querySelectorAll('.tarona-results-bar');
    let rafId = 0;

    const tick = () => {
      analyser.getByteFrequencyData(data);
      bars.forEach((bar, i) => {
        const idx = Math.floor(((i + 1) / (BAR_COUNT + 1)) * data.length);
        const level = (data[idx] || 0) / 255;
        const scale = 0.2 + level * 0.85;
        bar.style.transform = `scaleY(${scale})`;
      });
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [analyserRef, isPlaying]);

  return (
    <span className="tarona-results-bars" ref={wrapRef} aria-hidden="true">
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <span key={i} className="tarona-results-bar" style={{ '--bar-i': i }} />
      ))}
    </span>
  );
};

export default TaronaPlayingBars;
