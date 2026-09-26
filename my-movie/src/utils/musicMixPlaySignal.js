/**
 * Mix uchun bitta signal. Progress reporterdan alohida.
 * Bar surilishi o‘zi marta emas. Pleer yurib qo‘shiqning 80% joyiga
 * yetganda bir marta ketadi. Orqaga qaytsa keyingi 80% yangi marta.
 * Server shu 80% ni yana o‘zi tekshiradi.
 */
import { postMixPlay } from '../api/musicMixApi';

/** music-mixes config dagi minListenRatio bilan bir xil. */
export const MIX_LISTEN_RATIO = 0.8;

const SEEK_FORWARD_SEC = 1.5;
const SEEK_BACK_SEC = 0.4;

/**
 * @param {number} listenedSeconds
 * @param {number} durationSec
 * @returns {boolean}
 */
export const isMixListenReached = (listenedSeconds, durationSec) => {
  const listened = Number(listenedSeconds);
  const duration = Number(durationSec);
  if (!Number.isFinite(listened) || listened < 0) return false;
  if (!Number.isFinite(duration) || duration <= 0) return false;
  return listened / duration >= MIX_LISTEN_RATIO;
};

const nextSessionId = (contentId) =>
  `${contentId}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;

export function createMusicMixPlaySignal() {
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

  const openNextPlay = () => {
    if (!contentId) return;
    sessionId = nextSessionId(contentId);
    sent = false;
    pending = false;
    retryAt = 0;
    armed = true;
    hold = false;
  };

  /**
   * @param {{ isLoggedIn?: boolean, currentTime?: number, durationSec?: number, isPlaying?: boolean }} input
   */
  const note = ({
    isLoggedIn = false,
    currentTime = 0,
    durationSec = 0,
    isPlaying = false,
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

    const reached = isMixListenReached(time, duration);
    if (!reached) {
      if (sent && !pending) openNextPlay();
      armed = true;
      hold = false;
      return;
    }

    if (jumped) {
      hold = true;
      return;
    }
    if (!isPlaying || sent || pending || Date.now() < retryAt) return;
    if (!armed && !hold) return;

    armed = false;
    hold = false;
    pending = true;
    postMixPlay({
      contentId,
      sessionId,
      listenedSeconds: time,
      durationSec: duration,
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
};
