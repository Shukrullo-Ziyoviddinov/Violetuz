const QUICK_MS = 1500;
const COMPLETE_RATIO = 0.9;

const newViewId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return null;
};

const roundedRatio = (watch) => {
  if (!watch.durationSec) return 0;
  const ratio = watch.playedMs / (watch.durationSec * 1000);
  return Math.max(0, Math.min(1, Math.round(ratio * 1000) / 1000));
};

const pushEvent = (watch, extra) => {
  const delta = Math.max(0, Math.round(watch.playedMs - watch.lastSentPlayed));
  watch.lastSentPlayed = watch.playedMs;
  watch.seq += 1;
  const event = {
    shortId: watch.shortId,
    viewId: watch.viewId,
    seq: watch.seq,
    passRatio: roundedRatio(watch),
    playedMsDelta: delta,
    final: extra.final === true,
    completionsDelta: extra.completionsDelta || 0,
  };
  if (extra.liked) event.liked = true;
  if (extra.commented) event.commented = true;
  if (extra.shared) event.shared = true;
  return event;
};

export const createWatch = (short) => {
  const viewId = newViewId();
  if (!viewId || !short || short.id == null) return null;
  return {
    viewId,
    seq: 0,
    shortId: short.id,
    playedMs: 0,
    lastSentPlayed: 0,
    lastMark: null,
    lastMediaTime: null,
    durationSec: 0,
    sent40: false,
    sent70: false,
    sentComplete: false,
    acted: false,
    closed: false,
  };
};

/**
 * Add real playback only. A seek jumps the media clock faster than the wall clock
 * and is ignored. A hidden page does not accumulate time.
 */
export const notePlayback = (watch, now, video, hidden) => {
  if (!watch || watch.closed) return;
  const playing = Boolean(video) && !video.paused && !hidden;
  const mediaTime = video && Number.isFinite(video.currentTime) ? video.currentTime : null;
  if (video && Number.isFinite(video.duration) && video.duration > 0) {
    watch.durationSec = video.duration;
  }
  if (
    playing &&
    watch.lastMark != null &&
    mediaTime != null &&
    watch.lastMediaTime != null
  ) {
    const wallMs = Math.max(0, now - watch.lastMark);
    const mediaMs = (mediaTime - watch.lastMediaTime) * 1000;
    if (mediaMs > 0 && mediaMs <= wallMs + 250) watch.playedMs += mediaMs;
  }
  watch.lastMark = playing ? now : null;
  if (mediaTime != null) watch.lastMediaTime = mediaTime;
};

export const progressEvents = (watch) => {
  if (!watch || watch.closed) return [];
  const ratio = roundedRatio(watch);
  const events = [];
  if (!watch.sent40 && ratio >= 0.4) {
    watch.sent40 = true;
    events.push(pushEvent(watch, { final: false }));
  }
  if (!watch.sent70 && ratio >= 0.7) {
    watch.sent70 = true;
    events.push(pushEvent(watch, { final: false }));
  }
  if (!watch.sentComplete && ratio >= COMPLETE_RATIO) {
    watch.sentComplete = true;
    events.push(pushEvent(watch, { final: false, completionsDelta: 1 }));
  }
  return events;
};

export const signalWatch = (watch, flags) => {
  if (!watch || watch.closed) return null;
  watch.acted = true;
  return pushEvent(watch, { final: false, ...flags });
};

export const closeWatch = (watch) => {
  if (!watch || watch.closed) return null;
  watch.closed = true;
  watch.lastMark = null;
  const meaningful = watch.acted
    || watch.sent40
    || watch.sent70
    || watch.sentComplete
    || (watch.durationSec > 0 && watch.playedMs >= QUICK_MS);
  if (!meaningful) return null;
  return pushEvent(watch, { final: true });
};
