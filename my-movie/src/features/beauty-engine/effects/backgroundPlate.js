import { revokeTemporaryUrl } from '../core/temporaryUrls.js';

const httpUrl = (value) => {
  if (typeof value !== 'string') return '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.toString();
  } catch {
    return '';
  }
};

export function createBackgroundPlate() {
  let image = null;
  let video = null;
  let url = '';
  let failed = false;

  const clearElement = (element) => {
    if (!element) return;
    revokeTemporaryUrl(element.src);
    if (typeof element.pause === 'function') element.pause();
    element.removeAttribute('src');
    element.src = '';
    if (typeof element.load === 'function') element.load();
  };

  const clearMedia = () => {
    clearElement(video);
    clearElement(image);
    image = null;
    video = null;
    url = '';
    failed = false;
  };

  return {
    sync(background) {
      const mode = background?.mode;
      if (mode !== 'image' && mode !== 'video') {
        clearMedia();
        return;
      }
      const next = httpUrl(background.url);
      if (!next) {
        clearMedia();
        failed = true;
        return;
      }
      if (next === url && !failed) return;
      clearMedia();
      url = next;
      if (mode === 'image') {
        image = new Image();
        image.crossOrigin = 'anonymous';
        image.referrerPolicy = 'no-referrer';
        image.onload = () => {};
        image.onerror = () => { failed = true; };
        image.src = next;
        return;
      }
      video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.defaultMuted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.onerror = () => { failed = true; };
      video.src = next;
      const pending = video.play();
      pending?.catch?.(() => { failed = true; });
    },

    ready(mode) {
      if (failed || (mode !== 'image' && mode !== 'video')) return false;
      if (image) return image.complete && image.naturalWidth > 0;
      return Boolean(video && video.readyState >= 2 && video.videoWidth > 0);
    },

    source() {
      return image || video || null;
    },

    failed() {
      return failed;
    },

    block() {
      failed = true;
    },

    destroy() {
      clearMedia();
    },
  };
}
