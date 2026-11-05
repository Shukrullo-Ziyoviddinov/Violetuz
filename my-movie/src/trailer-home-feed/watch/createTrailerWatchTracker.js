import { TRAILER_WATCH_CONFIG } from './trailerWatchConfig';

const EVENTS = new Set(['sample', 'playing', 'pause', 'waiting', 'seeking', 'seeked', 'ratechange', 'ended', 'hidden', 'visible']);
const BREAK_EVENTS = new Set(['playing', 'seeking', 'seeked', 'visible']);
const STOP_EVENTS = new Set(['pause', 'waiting', 'seeking', 'seeked', 'ended', 'hidden', 'visible']);

const validNumber = (value) => typeof value === 'number' && Number.isFinite(value);

/** Union actual played ranges without counting replays twice. Does not bridge unwatched gaps. */
const mergeRange = (ranges, from, to) => {
  const result = [];
  let start = from;
  let end = to;
  for (const range of ranges) {
    if (range[1] < start) result.push(range);
    else if (end < range[0]) {
      result.push([start, end]);
      start = range[0];
      end = range[1];
    } else {
      start = Math.min(start, range[0]);
      end = Math.max(end, range[1]);
    }
  }
  result.push([start, end]);
  return result;
};

/**
 * One in-memory tracker per trailer/playback session; no DOM, storage or network.
 * `nowMs` must use a monotonic clock such as performance.now().
 * See README for event ordering: seeks and unobserved gaps are not playback.
 */
export function createTrailerWatchTracker({ durationSec, config = {} } = {}) {
  if (!validNumber(durationSec) || durationSec <= 0) throw new TypeError('A finite positive trailer duration is required');
  const policy = { ...TRAILER_WATCH_CONFIG, ...config };
  for (const key of Object.keys(TRAILER_WATCH_CONFIG)) {
    if (!validNumber(policy[key]) || policy[key] < 0) throw new TypeError(`Invalid watch policy: ${key}`);
  }
  if (policy.maxSampleGapMs <= 0) throw new TypeError('maxSampleGapMs must be positive');

  let previous = null;
  let intervals = [];
  let realWatchedSeconds = 0;
  let totalPlayedSeconds = 0;

  const snapshot = () => {
    const uniqueWatchedSeconds = Math.min(durationSec, intervals.reduce((sum, [start, end]) => sum + end - start, 0));
    return {
      durationSec,
      intervals: intervals.map((range) => [...range]),
      realWatchedSeconds,
      totalPlayedSeconds,
      uniqueWatchedSeconds,
      rewatchedSeconds: Math.max(0, totalPlayedSeconds - uniqueWatchedSeconds),
      coverage: Math.min(1, uniqueWatchedSeconds / durationSec),
      coveragePercent: Math.min(100, uniqueWatchedSeconds / durationSec * 100),
    };
  };

  const note = ({ event = 'sample', currentTime, nowMs, playbackRate, playing, visible } = {}) => {
    if (!EVENTS.has(event)) throw new TypeError(`Unknown trailer watch event: ${event}`);
    if (!validNumber(currentTime) || currentTime < 0 || currentTime > durationSec
      || !validNumber(nowMs) || nowMs < 0
      || (playbackRate !== undefined && (!validNumber(playbackRate) || playbackRate <= 0))
      || (playing !== undefined && typeof playing !== 'boolean')
      || (visible !== undefined && typeof visible !== 'boolean')) {
      previous = null; // Malformed samples cannot bridge two valid intervals.
      return snapshot();
    }
    // Duplicate/out-of-order samples cannot move the baseline backwards.
    if (previous && (nowMs < previous.nowMs || (nowMs === previous.nowMs && event === 'sample'))) return snapshot();

    const nextRate = playbackRate ?? previous?.playbackRate ?? 1;
    const nextVisible = event === 'hidden' ? false : event === 'visible' ? true : visible ?? previous?.visible ?? true;
    const rateChangedWithoutBoundary = previous && nextRate !== previous.playbackRate && event !== 'ratechange';
    if (previous?.playing && previous.visible && !BREAK_EVENTS.has(event) && !rateChangedWithoutBoundary) {
      const elapsedMs = nowMs - previous.nowMs;
      const delta = currentTime - previous.currentTime;
      const expected = elapsedMs / 1000 * previous.playbackRate;
      const tolerance = policy.clockToleranceSeconds + expected * policy.clockToleranceRatio;
      // Large jumps (including missing seek events) and long background gaps are rejected.
      if (elapsedMs <= policy.maxSampleGapMs && delta > policy.intervalEpsilonSeconds && delta <= expected + tolerance) {
        intervals = mergeRange(intervals, previous.currentTime, currentTime);
        totalPlayedSeconds += delta;
        // Stalls do not earn wall time; 2x playback earns media coverage at 2x.
        realWatchedSeconds += Math.min(elapsedMs / 1000, delta / previous.playbackRate);
      }
    }

    const nextPlaying = STOP_EVENTS.has(event) ? false : event === 'playing' ? true : Boolean(previous?.playing && playing !== false);
    previous = { currentTime, nowMs, playbackRate: nextRate, playing: nextPlaying, visible: nextVisible };
    return snapshot();
  };

  const reset = () => {
    previous = null;
    intervals = [];
    realWatchedSeconds = 0;
    totalPlayedSeconds = 0;
    return snapshot();
  };

  return { note, snapshot, reset };
}
