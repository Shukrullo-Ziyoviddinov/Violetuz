'use strict'; // eslint-disable-line strict -- Shared standalone CommonJS protocol.

// Protocol v1: cumulative snapshots of ONE playback session, never increments.
const LIMITS = Object.freeze({ maxDurationSec: 14400, maxSessionSeconds: 86400, maxRanges: 1024, maxPlaybackRate: 4 });
const finite = (n) => typeof n === 'number' && Number.isFinite(n);
const id = (value) => {
  if (!['number', 'string'].includes(typeof value) || !/^\d+$/.test(String(value))) throw new TypeError('Invalid trailer identity');
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result <= 0) throw new TypeError('Invalid trailer identity');
  return result;
};

const unionRanges = (ranges) => {
  const sorted = ranges.map((range) => [...range]).sort((a, b) => a[0] - b[0]);
  const result = [];
  for (const range of sorted) {
    const last = result[result.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else result.push(range);
  }
  return result;
};

const derive = (snapshot) => {
  const uniqueWatchedSeconds = snapshot.intervals.reduce((sum, [a, b]) => sum + b - a, 0);
  return { ...snapshot, uniqueWatchedSeconds, coverage: Math.min(1, uniqueWatchedSeconds / snapshot.durationSec),
    rewatchedSeconds: Math.max(0, snapshot.totalPlayedSeconds - uniqueWatchedSeconds) };
};

const validateProgressReport = (input) => {
  if (!input || typeof input !== 'object') throw new TypeError('Progress report required');
  const movieId = id(input.movieId);
  const trailerId = id(input.trailerId);
  if (typeof input.sessionId !== 'string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(input.sessionId)) throw new TypeError('Invalid sessionId');
  const { durationSec, realWatchedSeconds, totalPlayedSeconds } = input;
  if (!finite(durationSec) || durationSec <= 0 || durationSec > LIMITS.maxDurationSec
    || !finite(realWatchedSeconds) || realWatchedSeconds < 0 || realWatchedSeconds > LIMITS.maxSessionSeconds
    || !finite(totalPlayedSeconds) || totalPlayedSeconds < 0
    || totalPlayedSeconds > realWatchedSeconds * LIMITS.maxPlaybackRate + 0.001) throw new TypeError('Invalid progress counters');
  if (!Array.isArray(input.intervals) || input.intervals.length > LIMITS.maxRanges) throw new TypeError('Invalid played intervals');
  for (const range of input.intervals) {
    if (!Array.isArray(range) || range.length !== 2 || !range.every(finite)
      || range[0] < 0 || range[1] <= range[0] || range[1] > durationSec) throw new TypeError('Invalid played interval');
  }
  const result = derive({ movieId, trailerId, sessionId: input.sessionId, durationSec,
    realWatchedSeconds, totalPlayedSeconds, intervals: unionRanges(input.intervals) });
  if (result.uniqueWatchedSeconds > totalPlayedSeconds + 0.001
    || (totalPlayedSeconds > 0 && result.uniqueWatchedSeconds === 0)) throw new TypeError('Coverage and played time disagree');
  return result;
};

const mergeSessionProgress = (previous, incoming) => {
  const next = validateProgressReport(incoming);
  if (!previous) return next;
  const old = validateProgressReport(previous);
  if (old.movieId !== next.movieId || old.trailerId !== next.trailerId || old.sessionId !== next.sessionId
    || old.durationSec !== next.durationSec) throw new TypeError('Playback session identity/duration changed');
  // A session's snapshots form one monotonic sequence. Reject contradictory payloads,
  // but allow a smaller/older report as an idempotent retry.
  const oldTotal = old.totalPlayedSeconds;
  const nextTotal = next.totalPlayedSeconds;
  const newer = nextTotal > oldTotal ? next : old;
  const older = nextTotal > oldTotal ? old : next;
  const mergedRanges = unionRanges([...old.intervals, ...next.intervals]);
  const covered = mergedRanges.reduce((sum, [a, b]) => sum + b - a, 0);
  if (newer.realWatchedSeconds + 0.001 < older.realWatchedSeconds
    || newer.totalPlayedSeconds - older.totalPlayedSeconds > (newer.realWatchedSeconds - older.realWatchedSeconds) * LIMITS.maxPlaybackRate + 0.001
    || covered > newer.uniqueWatchedSeconds + 0.001
    || (nextTotal === oldTotal && Math.abs(old.realWatchedSeconds - next.realWatchedSeconds) > 0.001)) {
    throw new TypeError('Non-cumulative session snapshot');
  }
  return derive({ ...newer, intervals: mergedRanges });
};

// Separate sessions add genuine replay time. Union coverage across their normalized
// positions, so repeated playback does not inflate completion (even at different durations).
const summarizeProgress = (sessions) => {
  const normalized = unionRanges(sessions.flatMap((s) => s.intervals.map(([a, b]) => [a / s.durationSec, b / s.durationSec])));
  return {
    coverage: Math.min(1, normalized.reduce((sum, [a, b]) => sum + b - a, 0)),
    normalizedIntervals: normalized,
    realWatchedSeconds: sessions.reduce((sum, s) => sum + s.realWatchedSeconds, 0),
    totalPlayedSeconds: sessions.reduce((sum, s) => sum + s.totalPlayedSeconds, 0),
    sessionCount: sessions.length,
  };
};

module.exports = { LIMITS, validateProgressReport, mergeSessionProgress, summarizeProgress };
