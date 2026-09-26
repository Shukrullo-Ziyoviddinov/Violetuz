/**
 * Mix uchun bitta signal. Progress reporterdan alohida.
 * Sessiya davomiylikning 80% iga yetganda bir marta ketadi.
 * Server shu 80% ni yana o'zi tekshiradi.
 */
import { postMixPlay } from '../api/musicMixApi';

/** music-mixes config dagi minListenRatio bilan bir xil. */
export const MIX_LISTEN_RATIO = 0.8;

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
  let baseline = 0;
  let sent = false;
  let pending = false;
  let gateDuration = null;
  let retryAt = 0;

  const begin = (id, listenedNow = 0) => {
    const next = id == null || id === '' ? '' : String(id);
    pending = false;
    gateDuration = null;
    retryAt = 0;
    if (!next) {
      sessionId = null;
      contentId = null;
      baseline = 0;
      sent = false;
      return;
    }
    sessionId = nextSessionId(next);
    contentId = next;
    baseline = Math.max(0, Number(listenedNow) || 0);
    sent = false;
  };

  const clear = () => begin(null);

  /**
   * Katalog davomiyligi bo‘lsa shu olinadi. Server ham shu raqamga qaraydi.
   * Rad etilsa signal qayta ochiladi. Tinglandi yuborishiga tegmaydi.
   * @param {{ isLoggedIn?: boolean, listenedSeconds?: number, durationSec?: number }} input
   */
  const note = ({ isLoggedIn = false, listenedSeconds = 0, durationSec = 0 } = {}) => {
    if (!isLoggedIn || !sessionId || !contentId || sent || pending) return;
    if (Date.now() < retryAt) return;
    const gained = Math.max(0, (Number(listenedSeconds) || 0) - baseline);
    const gate = gateDuration || durationSec;
    if (!isMixListenReached(gained, gate)) return;
    pending = true;
    const payload = {
      contentId,
      sessionId,
      listenedSeconds: gained,
    };
    postMixPlay(payload)
      .then((data) => {
        pending = false;
        if (data?.queued) {
          sent = true;
          return;
        }
        const catalogDuration = Number(data?.durationSec);
        if (data?.reason === 'below_ratio' && Number.isFinite(catalogDuration) && catalogDuration > 0) {
          gateDuration = catalogDuration;
          return;
        }
        sent = true;
      })
      .catch(() => {
        pending = false;
        retryAt = Date.now() + 5000;
      });
  };

  return { begin, clear, note };
};
