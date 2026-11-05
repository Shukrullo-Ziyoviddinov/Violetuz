import { createTrailerWatchTracker } from './createTrailerWatchTracker';
import { createTrailerSessionId } from '../progress/guestTrailerProgress';

// One adapter lives as long as the actual media source and resolved viewer.
export function bindTrailerWatch(video, { movieId, trailerId, save, onSession = () => {}, onSample = () => {}, ownsMedia = () => true, clock = () => performance.now() }) {
  let tracker;
  let sessionId;
  let lastSaved = 0;
  let finished = false;
  const listeners = [];
  const note = (event) => {
    if (!ownsMedia() || !tracker) return;
    const sample = { event, currentTime: video.currentTime, nowMs: clock(), playbackRate: video.playbackRate,
      visible: !document.hidden, playing: !video.paused && !video.seeking };
    tracker.note(sample);
    onSample(sample, sessionId);
  };
  const persist = () => {
    const snapshot = tracker?.snapshot();
    if (!snapshot || snapshot.totalPlayedSeconds <= lastSaved) return;
    const report = { ...snapshot, movieId, trailerId, sessionId };
    try {
      // Queue/storage writes must happen synchronously, before the document exits.
      const result = save(report);
      lastSaved = snapshot.totalPlayedSeconds;
      Promise.resolve(result).then((value) => {
        if (value?.ok === false) lastSaved = 0;
      }).catch(() => { lastSaved = 0; });
    } catch { lastSaved = 0; }
  };
  const initialize = () => {
    if (finished || !ownsMedia() || !Number.isFinite(video.duration) || video.duration <= 0 || video.duration > 14400) return;
    if (tracker?.snapshot().durationSec === video.duration) return;
    persist();
    tracker = createTrailerWatchTracker({ durationSec: video.duration });
    sessionId = createTrailerSessionId();
    lastSaved = 0;
    onSession({ ...tracker.snapshot(), movieId, trailerId, sessionId });
    if (!video.paused && !video.seeking && !document.hidden) note('playing');
  };
  const listen = (target, event, handler) => {
    target.addEventListener(event, handler);
    listeners.push(() => target.removeEventListener(event, handler));
  };
  listen(video, 'loadedmetadata', initialize);
  listen(video, 'durationchange', initialize);
  listen(video, 'trailer-watch-before-replace', () => {
    if (!tracker) return;
    note('pause');
    persist();
    tracker = undefined;
    finished = true;
  });
  listen(video, 'emptied', () => { persist(); tracker = undefined; });
  ['playing', 'pause', 'waiting', 'seeking', 'seeked', 'ratechange', 'ended'].forEach((event) => {
    listen(video, event, () => {
      initialize();
      note(event);
      if (event === 'seeked' && !video.paused && !document.hidden) note('playing');
      if (['pause', 'waiting', 'ended', 'seeking'].includes(event)) persist();
    });
  });
  listen(video, 'trailer-watch-before-seek', () => { note('sample'); note('seeking'); });
  listen(video, 'trailer-watch-before-rate', () => note('sample'));
  listen(document, 'visibilitychange', () => {
    note(document.hidden ? 'hidden' : 'visible');
    if (document.hidden) persist();
    else if (!video.paused && !video.seeking) note('playing');
  });
  listen(window, 'pagehide', () => { note('hidden'); persist(); });
  initialize();
  let ticks = 0;
  const timer = setInterval(() => {
    if (tracker && !video.seeking) note('sample');
    if (++ticks % 40 === 0) persist();
  }, 250);
  return () => {
    // Only close a final fraction if this is still the original media source.
    if (ownsMedia() && !video.seeking) note('pause');
    persist();
    clearInterval(timer);
    listeners.forEach((remove) => remove());
  };
}
