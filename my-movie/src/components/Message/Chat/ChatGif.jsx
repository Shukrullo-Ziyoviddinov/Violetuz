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

const blobUrls = new Map();
const blobJobs = new Map();
const posters = new Map();
const wantedPosters = new Set();
const posterListeners = new Map();
let posterBusy = false;

const gifBlobUrl = (file) => {
  if (blobUrls.has(file)) return Promise.resolve(blobUrls.get(file));
  const pending = blobJobs.get(file);
  if (pending) return pending;
  const job = fetch(`/Gif/${encodeURIComponent(file)}`, { cache: 'force-cache' })
    .then((res) => {
      if (!res.ok) throw new Error('gif');
      const type = res.headers.get('content-type') || '';
      if (type.includes('text/html')) throw new Error('gif');
      return res.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      blobUrls.set(file, url);
      blobJobs.delete(file);
      return url;
    })
    .catch((err) => {
      blobJobs.delete(file);
      throw err;
    });
  blobJobs.set(file, job);
  return job;
};

const capturePoster = async (file) => {
  if (posters.has(file)) return posters.get(file);
  const url = await gifBlobUrl(file);
  if (!wantedPosters.has(file)) return posters.get(file) || '';
  const video = document.createElement('video');
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = url;
  await new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('gif')), 8000);
    const done = (ok) => {
      window.clearTimeout(timer);
      if (ok) resolve();
      else reject(new Error('gif'));
    };
    video.addEventListener('loadeddata', () => done(true), { once: true });
    video.addEventListener('error', () => done(false), { once: true });
  });
  try {
    await video.play();
  } catch (_err) {
    // Birinchi kadr o‘qilgan bo‘lsa, rasm baribir olinadi.
  }
  await new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
  });
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) throw new Error('gif');
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 220 / Math.max(width, height));
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('gif');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const poster = canvas.toDataURL('image/jpeg', 0.74);
  posters.set(file, poster);
  video.pause();
  video.removeAttribute('src');
  video.load();
  return poster;
};

const notifyPoster = (file, poster) => {
  const listeners = posterListeners.get(file);
  posterListeners.delete(file);
  wantedPosters.delete(file);
  if (!listeners) return;
  listeners.forEach((listener) => listener(poster));
};

const pumpPosters = () => {
  if (posterBusy) return;
  const file = [...wantedPosters].find((name) => !posters.has(name));
  if (!file) return;
  posterBusy = true;
  capturePoster(file).then(
    (poster) => {
      posterBusy = false;
      if (wantedPosters.has(file)) notifyPoster(file, poster);
      pumpPosters();
    },
    () => {
      posterBusy = false;
      if (wantedPosters.has(file)) notifyPoster(file, '');
      pumpPosters();
    }
  );
};

const watchPoster = (file) => {
  if (posters.has(file)) return () => {};
  wantedPosters.add(file);
  pumpPosters();
  return () => {
    const listeners = posterListeners.get(file);
    if (listeners) listeners.clear();
    posterListeners.delete(file);
    wantedPosters.delete(file);
  };
};

const listenPoster = (file, listener) => {
  if (posters.has(file)) {
    listener(posters.get(file));
    return () => {};
  }
  let listeners = posterListeners.get(file);
  if (!listeners) {
    listeners = new Set();
    posterListeners.set(file, listeners);
  }
  listeners.add(listener);
  const stopWant = watchPoster(file);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) stopWant();
  };
};

const ChatGif = ({ file, className = '', label = '', root = null, fit = false, max = 200, still = false, onColor = null }) => {
  const hostRef = useRef(null);
  const videoRef = useRef(null);
  const visibleRef = useRef(false);
  const safe = safeGifFile(file);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(() => still && posters.has(safe));
  const [poster, setPoster] = useState(() => (still ? posters.get(safe) || '' : ''));
  const [box, setBox] = useState(null);
  const onColorRef = useRef(onColor);
  onColorRef.current = onColor;

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return undefined;
    if (still && !root) {
      visibleRef.current = false;
      setVisible(false);
      return undefined;
    }
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
  }, [root, still]);

  useEffect(() => {
    if (!still || !visible || !safe || poster) return undefined;
    return listenPoster(safe, (next) => {
      if (next) setPoster(next);
      setReady(true);
    });
  }, [poster, safe, still, visible]);

  useEffect(() => {
    if (still) return undefined;
    const node = videoRef.current;
    if (!node) return undefined;
    if (!visible || !safe) {
      node.pause();
      return undefined;
    }
    let gone = false;
    let painted = false;
    const play = () => {
      if (gone || !visibleRef.current || node.error) return;
      node.play().catch(() => {});
    };
    const show = () => {
      if (gone) return;
      setReady(true);
      play();
    };
    const sample = () => {
      if (gone || painted || !onColorRef.current || node.error) return;
      const hex = colorFromVideo(node);
      if (!hex) return;
      painted = true;
      onColorRef.current(hex);
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
      if (gone || !visibleRef.current || node.error) return;
      play();
    };
    node.addEventListener('loadedmetadata', sizeToFrame);
    node.addEventListener('loadedmetadata', show);
    node.addEventListener('loadeddata', sample);
    node.addEventListener('timeupdate', sample);
    node.addEventListener('error', show);
    node.addEventListener('pause', resume);
    gifBlobUrl(safe).then(
      (url) => {
        if (gone) return;
        if (node.dataset.file !== safe) {
          node.dataset.file = safe;
          node.src = url;
          node.load();
        }
        play();
      },
      () => {
        if (!gone) setReady(true);
      }
    );
    return () => {
      gone = true;
      node.removeEventListener('loadedmetadata', sizeToFrame);
      node.removeEventListener('loadedmetadata', show);
      node.removeEventListener('loadeddata', sample);
      node.removeEventListener('timeupdate', sample);
      node.removeEventListener('error', show);
      node.removeEventListener('pause', resume);
    };
  }, [fit, max, safe, still, visible]);

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
      {still ? (
        poster ? <img className="chat-gif-still" src={poster} alt="" /> : null
      ) : (
        <video
          ref={videoRef}
          className="chat-gif-video"
          style={frame ? { width: frame.w, height: frame.h } : undefined}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          controls={false}
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
          aria-hidden="true"
        />
      )}
    </span>
  );
};

export default ChatGif;
