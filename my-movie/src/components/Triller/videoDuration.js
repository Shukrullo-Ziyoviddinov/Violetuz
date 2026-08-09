const durationCache = new Map();
const pending = new Map();

export const formatVideoDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const loadVideoDuration = (src) => {
  if (!src || typeof src !== 'string') {
    return Promise.resolve(null);
  }

  if (durationCache.has(src)) {
    return Promise.resolve(durationCache.get(src));
  }

  if (pending.has(src)) {
    return pending.get(src);
  }

  const promise = new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
      pending.delete(src);
    };

    const finish = (value) => {
      durationCache.set(src, value);
      cleanup();
      resolve(value);
    };

    video.addEventListener('loadedmetadata', () => {
      const d = Number(video.duration);
      finish(Number.isFinite(d) && d > 0 ? d : null);
    });

    video.addEventListener('error', () => finish(null));
    video.src = encodeURI(src);
  });

  pending.set(src, promise);
  return promise;
};
