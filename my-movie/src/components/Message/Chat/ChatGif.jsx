import React, { useEffect, useRef, useState } from 'react';
import SkeletonLoader from '../../SkeletonLoader/SkeletonLoader';

const hexByte = (value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');

export const colorFromVideo = (video) => {
  if (!video?.videoWidth || !video?.videoHeight) return '';
  const size = 40;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '';
  try {
    ctx.drawImage(video, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    const bins = new Map();
    const quantize = (value) => Math.round(value / 16) * 16;
    let best = 0;
    let key = '';
    for (let y = 8; y < 32; y += 2) {
      for (let x = 8; x < 32; x += 2) {
        const index = (y * size + x) * 4;
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        if (data[index + 3] < 180) continue;
        const bright = (red + green + blue) / 3;
        if (bright < 28 || bright > 242) continue;
        const id = `${quantize(red)},${quantize(green)},${quantize(blue)}`;
        const count = (bins.get(id) || 0) + 1;
        bins.set(id, count);
        if (count > best) {
          best = count;
          key = id;
        }
      }
    }
    if (!key) return '';
    let [red, green, blue] = key.split(',').map(Number);
    const max = Math.max(red, green, blue);
    if (max > 0 && max < 188) {
      const scale = 188 / max;
      red = Math.round(red * scale);
      green = Math.round(green * scale);
      blue = Math.round(blue * scale);
    }
    return `#${hexByte(red)}${hexByte(green)}${hexByte(blue)}`;
  } catch (_err) {
    return '';
  }
};

const safeGifFile = (file) => {
  const name = String(file || '').trim();
  if (!name || name.length > 180) return '';
  if (name.includes('/') || name.includes('\\') || name.includes('..')) return '';
  if (!/\.(mp4|mov)$/i.test(name)) return '';
  return name;
};

const ChatGif = ({ file, className = '', label = '', root = null, fit = false, max = 280, onColor = null }) => {
  const hostRef = useRef(null);
  const videoRef = useRef(null);
  const visibleRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [box, setBox] = useState(null);
  const safe = safeGifFile(file);
  const onColorRef = useRef(onColor);
  onColorRef.current = onColor;

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver !== 'function') {
      visibleRef.current = true;
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      setVisible(entry.isIntersecting);
    }, { root: root || null, rootMargin: '48px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [root]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return undefined;
    if (!visible || !safe) {
      node.pause();
      node.removeAttribute('src');
      node.load();
      setReady(false);
      return undefined;
    }
    let gone = false;
    let painted = false;
    setReady(false);
    const sample = () => {
      if (gone || painted || !onColorRef.current) return;
      const hex = colorFromVideo(node);
      if (!hex) return;
      painted = true;
      onColorRef.current(hex);
    };
    const play = () => {
      if (gone || !visibleRef.current) return;
      node.play().catch(() => {});
    };
    const mark = (event) => {
      if (gone) return;
      setReady(true);
      if (event?.type === 'error') return;
      play();
    };
    const sizeToFrame = () => {
      if (!fit || gone) return;
      const width = node.videoWidth;
      const height = node.videoHeight;
      if (!width || !height) return;
      const thread = node.closest('.chat-thread');
      const room = thread?.clientWidth || window.innerWidth;
      const capW = Math.min(max, Math.round(room * 0.72));
      const capH = Math.min(Math.round(max * 1.45), Math.round(window.innerHeight * 0.5));
      const scale = Math.min(1, capW / width, capH / height);
      setBox({
        w: Math.max(1, Math.round(width * scale)),
        h: Math.max(1, Math.round(height * scale)),
      });
    };
    const resume = () => {
      if (gone || !visibleRef.current || !fit || node.error) return;
      play();
    };
    node.src = `/Gif/${encodeURIComponent(safe)}`;
    node.addEventListener('loadedmetadata', sizeToFrame);
    node.addEventListener('loadeddata', mark);
    node.addEventListener('loadeddata', sample);
    node.addEventListener('timeupdate', sample);
    node.addEventListener('error', mark);
    node.addEventListener('pause', resume);
    node.load();
    return () => {
      gone = true;
      node.removeEventListener('loadedmetadata', sizeToFrame);
      node.removeEventListener('loadeddata', mark);
      node.removeEventListener('loadeddata', sample);
      node.removeEventListener('timeupdate', sample);
      node.removeEventListener('error', mark);
      node.removeEventListener('pause', resume);
    };
  }, [fit, max, safe, visible]);

  const frame = fit ? (box || { w: Math.min(max, 168), h: Math.min(Math.round(max * 0.75), 126) }) : null;

  return (
    <span
      ref={hostRef}
      className={`chat-gif${fit ? ' is-fit' : ''} ${className}`.trim()}
      style={frame ? { width: frame.w, height: frame.h } : undefined}
      role="img"
      aria-label={label || undefined}
    >
      {visible && !ready ? <SkeletonLoader variant="block" className="chat-lottie-skeleton" /> : null}
      <video
        ref={videoRef}
        className="chat-gif-video"
        style={frame ? { width: frame.w, height: frame.h } : undefined}
        muted
        loop
        playsInline
        autoPlay
        preload="none"
        controls={false}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        aria-hidden="true"
      />
    </span>
  );
};

export default ChatGif;
