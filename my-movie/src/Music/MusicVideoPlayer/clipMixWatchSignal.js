/**
 * Klip mixi uchun "ko'rildi". Musiqa signalidan va tinglandi hisobidan alohida.
 * Bar surilishi o'zi marta emas. Video yurib davomiylikning 80% joyiga
 * yetganda bir marta ketadi. Orqaga qaytsa keyingi 80% yangi marta.
 * Mehmon yozilmaydi. So'rov hozirgi mix manziliga, tur klip.
 */
import { postMixPlay } from '../../api/musicMixApi';

/** music-mixes config dagi minListenRatio bilan bir xil. */
export const CLIP_WATCH_RATIO = 0.8;

const SEEK_FORWARD_SEC = 1.5;
const SEEK_BACK_SEC = 0.4;

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
  let lastTime = null;
  let armed = true;
  let hold = false;

  const begin = (id) => {
    const next = id == null || id === '' ? '' : String(id);
    pending = false;
    retryAt = 0;
    lastTime = null;
    armed = true;
    hold = false;
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
    armed = true;
    hold = false;
  };

  /**
   * @param {{ isLoggedIn?: boolean, currentTime?: number, durationSec?: number, isPlaying?: boolean, ended?: boolean }} input
   */
  const note = ({
    isLoggedIn = false,
    currentTime = 0,
    durationSec = 0,
    isPlaying = false,
    ended = false,
  } = {}) => {
    const time = Number(currentTime);
    const duration = Number(durationSec);
    if (!Number.isFinite(time) || time < 0 || !Number.isFinite(duration) || duration <= 0) {
      return;
    }

    const prev = lastTime;
    const jumped =
      prev != null && (time - prev > SEEK_FORWARD_SEC || prev - time > SEEK_BACK_SEC);
    lastTime = time;

    if (!isLoggedIn || !sessionId || !contentId) return;

    const reached = isClipWatchReached(time, duration);
    if (!reached) {
      if (sent && !pending) openNextWatch();
      armed = true;
      hold = false;
      return;
    }

    if (jumped) {
      hold = true;
      // Pleer yurib tursa keyingi tick kutadi (surish o'zi emas).
      // Pauza yoki ended bo'lsa keyingi tick kelmaydi — shu yerda yoziladi.
      if (isPlaying && !ended) return;
    }
    if (sent || pending || Date.now() < retryAt) return;
    if (!armed && !hold) return;

    armed = false;
    hold = false;
    pending = true;
    postMixPlay({
      contentId,
      sessionId,
      listenedSeconds: time,
      durationSec: duration,
      contentType: 'klip',
    })
      .then((data) => {
        pending = false;
        if (data?.queued) {
          sent = true;
          return;
        }
        if (data?.reason === 'below_ratio') {
          armed = true;
          return;
        }
        sent = true;
      })
      .catch(() => {
        pending = false;
        armed = true;
        retryAt = Date.now() + 5000;
      });
  };

  return { begin, clear, note };
}
