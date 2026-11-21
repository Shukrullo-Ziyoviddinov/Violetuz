import React, { useEffect, useRef, useState } from 'react';
import SkeletonLoader from '../../SkeletonLoader/SkeletonLoader';

const safeGifFile = (file) => {
  const name = String(file || '').trim();
  if (!name || name.length > 180) return '';
  if (name.includes('/') || name.includes('\\') || name.includes('..')) return '';
  if (!/\.(mp4|mov)$/i.test(name)) return '';
  return name;
};

const ChatGif = ({ file, className = '', label = '', root = null, fit = false, max = 280 }) => {
  const hostRef = useRef(null);
  const videoRef = useRef(null);
  const visibleRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [box, setBox] = useState(null);
  const safe = safeGifFile(file);

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
    setReady(false);
    const play = () => {
      if (gone || !visibleRef.current) return;
      node.play().catch(() => {});
    };
    const mark = () => {
      if (gone) return;
      setReady(true);
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
      if (gone || !visibleRef.current || !fit) return;
      play();
    };
    node.src = `/Gif/${encodeURIComponent(safe)}`;
    node.addEventListener('loadedmetadata', sizeToFrame);
    node.addEventListener('loadeddata', mark);
    node.addEventListener('error', mark);
    node.addEventListener('pause', resume);
    node.load();
    return () => {
      gone = true;
      node.removeEventListener('loadedmetadata', sizeToFrame);
      node.removeEventListener('loadeddata', mark);
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
