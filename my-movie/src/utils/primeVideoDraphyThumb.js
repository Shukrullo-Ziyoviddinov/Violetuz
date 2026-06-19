/**
 * Thumbnail <video>: videoning o‘rtasidagi kadrga seek qiladi.
 * (Eslatma: opacity + --ready bilan yashirish ishlatilmaydi — rVFC ba’zan ishlamay qolardi.)
 */

function computeMiddleTime(video) {
  const d = video.duration;
  if (!Number.isFinite(d) || d <= 0) return 0.05;
  let t = d / 2;
  if (d > 0.1) t = Math.min(t, d - 0.04);
  return t;
}

export function primeVideoDraphyThumb(video) {
  if (!video || video.tagName !== 'VIDEO') return;
  if (video.dataset.draphyPrime === '1') return;
  video.dataset.draphyPrime = '1';

  const doSeek = () => {
    const t = computeMiddleTime(video);
    try {
      video.currentTime = t;
    } catch {
      /* noop */
    }
  };

  let fallbackTimer;
  let started = false;
  const startSeek = () => {
    if (started) return;
    started = true;
    if (fallbackTimer) clearTimeout(fallbackTimer);
    doSeek();
  };

  if (video.readyState >= 2) {
    startSeek();
    return;
  }

  video.addEventListener('loadeddata', startSeek, { once: true });
  video.addEventListener('canplay', startSeek, { once: true });

  fallbackTimer = window.setTimeout(() => {
    startSeek();
  }, 1200);
}
