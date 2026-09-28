/**
 * Klip mixi uchun "ko'rildi". Musiqa signalidan va tinglandi hisobidan alohida.
 * Playhead 80% ga yetganda bir marta. Bar bilan yetkazilsa ham (pauzada ham).
 * 80% dan pastga tushsa yangi sessiya. Mehmon yozilmaydi. Tur: klip.
 */
import { postMixPlay } from '../../api/musicMixApi';

/** music-mixes config dagi minListenRatio bilan bir xil. */
export const CLIP_WATCH_RATIO = 0.8;

/**
 * @param {number} watchedSeconds
 * @param {number} durationSec
 * @returns {boolean}
 */
export const isClipWatchReached = (watchedSeconds, durationSec) => {
  const watched = Number(watchedSeconds);
  const duration = Number(durationSec);
  if (!Number.isFinite(watched) || watched < 0) return false;
  if (!Number.isFinite(duration) || duration <= 0) return false;
  return watched / duration >= CLIP_WATCH_RATIO;
};

const nextSessionId = (contentId) =>
  `${contentId}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;

export function createClipMixWatchSignal() {
  let sessionId = null;
  let contentId = null;
  let sent = false;
  let pending = false;
  let retryAt = 0;

  const begin = (id) => {
    const next = id == null || id === '' ? '' : String(id);
    pending = false;
    retryAt = 0;
    if (!next) {
      sessionId = null;
      contentId = null;
      sent = false;
      return;
    }
    sessionId = nextSessionId(next);
    contentId = next;
    sent = false;
  };

  const clear = () => begin(null);

  const openNextWatch = () => {
    if (!contentId) return;
    sessionId = nextSessionId(contentId);
    sent = false;
    pending = false;
    retryAt = 0;
  };

  /**
   * @param {{ isLoggedIn?: boolean, currentTime?: number, durationSec?: number }} input
   */
  const note = ({
    isLoggedIn = false,
    currentTime = 0,
    durationSec = 0,
  } = {}) => {
    const time = Number(currentTime);
    const duration = Number(durationSec);
    if (!Number.isFinite(time) || time < 0 || !Number.isFinite(duration) || duration <= 0) {
      return;
    }

    if (!isLoggedIn || !sessionId || !contentId) return;

    const reached = isClipWatchReached(time, duration);
    if (!reached) {
      if (sent && !pending) openNextWatch();
      return;
    }

    if (sent || pending || Date.now() < retryAt) return;

    const postSession = sessionId;
    const postContentId = contentId;
    pending = true;
    postMixPlay({
      contentId: postContentId,
      sessionId: postSession,
      listenedSeconds: time,
      durationSec: duration,
      contentType: 'klip',
    })
      .then((data) => {
        if (sessionId !== postSession || contentId !== postContentId) {
          pending = false;
          return;
        }
        pending = false;
        if (data?.queued) {
          sent = true;
          return;
        }
        // not_clip / below_ratio / boshqa — sent qilib yopilmasin, qayta urinadi
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[clip-mix] play not queued', data?.reason || data);
        }
        retryAt = Date.now() + 1500;
      })
      .catch((err) => {
        if (sessionId !== postSession || contentId !== postContentId) {
          pending = false;
          return;
        }
        pending = false;
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[clip-mix] play request failed', err?.status || err?.message || err);
        }
        retryAt = Date.now() + 5000;
      });
  };

  return { begin, clear, note };
}
