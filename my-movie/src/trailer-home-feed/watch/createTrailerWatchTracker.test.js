import { createTrailerWatchTracker } from './createTrailerWatchTracker';

function playback(tracker, { from = 0, to = 60, rate = 1, startMs = 0 } = {}) {
  tracker.note({ event: 'playing', currentTime: from, nowMs: startMs, playbackRate: rate });
  let position = from;
  let nowMs = startMs;
  while (position < to - 1e-8) {
    const step = Math.min(rate * 0.25, to - position);
    position += step;
    nowMs += step / rate * 1000;
    tracker.note({ currentTime: position, nowMs, playbackRate: rate });
  }
  return nowMs;
}

test.each([1, 1.5, 2])('%sx playback covers the whole video in its actual real time', (rate) => {
  const tracker = createTrailerWatchTracker({ durationSec: 60 });
  playback(tracker, { rate });
  const result = tracker.snapshot();
  expect(result.coverage).toBeCloseTo(1);
  expect(result.uniqueWatchedSeconds).toBeCloseTo(60);
  expect(result.realWatchedSeconds).toBeCloseTo(60 / rate);
  expect(result.rewatchedSeconds).toBeCloseTo(0);
});

test('opening or seeking to the final frame does not count as viewing', () => {
  const tracker = createTrailerWatchTracker({ durationSec: 60 });
  tracker.note({ currentTime: 0, nowMs: 0 });
  tracker.note({ event: 'seeking', currentTime: 60, nowMs: 100 });
  tracker.note({ event: 'seeked', currentTime: 60, nowMs: 200 });
  tracker.note({ event: 'ended', currentTime: 60, nowMs: 300 });
  expect(tracker.snapshot().coverage).toBe(0);
});

test('progress scrubbing leaves skipped gaps unwatched; returning fills only those gaps', () => {
  const tracker = createTrailerWatchTracker({ durationSec: 60 });
  playback(tracker, { to: 15 });
  tracker.note({ event: 'seeking', currentTime: 15, nowMs: 15000 });
  tracker.note({ event: 'seeked', currentTime: 30, nowMs: 15100 });
  playback(tracker, { from: 30, to: 60, startMs: 15200 });
  expect(tracker.snapshot().intervals).toEqual([[0, 15], [30, 60]]);
  expect(tracker.snapshot().coveragePercent).toBeCloseTo(75);
  playback(tracker, { from: 15, to: 30, startMs: 50000 });
  expect(tracker.snapshot().coveragePercent).toBeCloseTo(100);
  expect(tracker.snapshot().intervals).toEqual([[0, 60]]);
});

test('10-second skip never adds ten watched seconds, even without seek events', () => {
  const tracker = createTrailerWatchTracker({ durationSec: 60 });
  playback(tracker, { to: 5 });
  tracker.note({ currentTime: 15, nowMs: 5100 });
  tracker.note({ currentTime: 15.25, nowMs: 5350 });
  expect(tracker.snapshot().uniqueWatchedSeconds).toBeCloseTo(5.25);
  expect(tracker.snapshot().intervals).toEqual([[0, 5], [15, 15.25]]);
});

test('pause at the same timestamp stops counting and buffering earns no time', () => {
  const tracker = createTrailerWatchTracker({ durationSec: 60 });
  playback(tracker, { to: 5 });
  tracker.note({ event: 'pause', currentTime: 5, nowMs: 5000 });
  tracker.note({ currentTime: 6, nowMs: 6000, playing: true });
  tracker.note({ currentTime: 7, nowMs: 7000, playing: true });
  expect(tracker.snapshot().uniqueWatchedSeconds).toBe(5);
  tracker.note({ event: 'playing', currentTime: 7, nowMs: 7100 });
  tracker.note({ event: 'waiting', currentTime: 7.5, nowMs: 7600 });
  tracker.note({ currentTime: 7.5, nowMs: 8000 });
  expect(tracker.snapshot().realWatchedSeconds).toBeCloseTo(5.5);
});

test('rate changes use the previous rate for the closing interval and the new rate afterward', () => {
  const tracker = createTrailerWatchTracker({ durationSec: 60 });
  playback(tracker, { to: 10 });
  tracker.note({ event: 'ratechange', currentTime: 10, nowMs: 10000, playbackRate: 2 });
  tracker.note({ currentTime: 12, nowMs: 11000, playbackRate: 2 });
  tracker.note({ event: 'ratechange', currentTime: 14, nowMs: 12000, playbackRate: 1.5 });
  tracker.note({ currentTime: 15.5, nowMs: 13000, playbackRate: 1.5 });
  expect(tracker.snapshot().uniqueWatchedSeconds).toBeCloseTo(15.5);
  expect(tracker.snapshot().realWatchedSeconds).toBeCloseTo(13);
});

test('replaying and backwards seeks add repeat time without inflating unique coverage', () => {
  const tracker = createTrailerWatchTracker({ durationSec: 60 });
  playback(tracker, { to: 20 });
  tracker.note({ event: 'seeking', currentTime: 5, nowMs: 20100 });
  playback(tracker, { from: 5, to: 15, rate: 2, startMs: 20200 });
  const result = tracker.snapshot();
  expect(result.uniqueWatchedSeconds).toBeCloseTo(20);
  expect(result.totalPlayedSeconds).toBeCloseTo(30);
  expect(result.rewatchedSeconds).toBeCloseTo(10);
  expect(result.realWatchedSeconds).toBeCloseTo(25);
});

test('hidden playback and long unobserved intervals do not fill coverage', () => {
  const tracker = createTrailerWatchTracker({ durationSec: 60 });
  playback(tracker, { to: 5 });
  tracker.note({ event: 'hidden', currentTime: 5, nowMs: 5000 });
  tracker.note({ currentTime: 6, nowMs: 6000 });
  tracker.note({ event: 'visible', currentTime: 10, nowMs: 10000 });
  tracker.note({ event: 'playing', currentTime: 10, nowMs: 10100 });
  tracker.note({ currentTime: 20, nowMs: 20100 });
  tracker.note({ currentTime: 20.5, nowMs: 20600 });
  expect(tracker.snapshot().intervals).toEqual([[0, 5], [20, 20.5]]);
});

test('stationary playhead, stale reports and invalid samples cannot accumulate time', () => {
  const tracker = createTrailerWatchTracker({ durationSec: 60 });
  playback(tracker, { to: 1 });
  tracker.note({ currentTime: 1, nowMs: 2000 });
  tracker.note({ currentTime: 50, nowMs: 1500 });
  tracker.note({ currentTime: 1.5, nowMs: 2500 });
  tracker.note({ currentTime: NaN, nowMs: 2600 });
  tracker.note({ currentTime: 2, nowMs: 3000 });
  expect(tracker.snapshot().realWatchedSeconds).toBeCloseTo(1.5);
  expect(tracker.snapshot().uniqueWatchedSeconds).toBeCloseTo(1.5);
});

test('ended credits its last played fraction without automatically filling the video', () => {
  const tracker = createTrailerWatchTracker({ durationSec: 60 });
  playback(tracker, { from: 59, to: 59.5 });
  tracker.note({ event: 'ended', currentTime: 60, nowMs: 1000 });
  expect(tracker.snapshot().uniqueWatchedSeconds).toBeCloseTo(1);
  expect(tracker.snapshot().coverage).toBeCloseTo(1 / 60);
});

test('snapshots are detached, reset clears state and independent trackers never share history', () => {
  const first = createTrailerWatchTracker({ durationSec: 60 });
  const second = createTrailerWatchTracker({ durationSec: 60 });
  playback(first, { to: 5 });
  first.snapshot().intervals[0][1] = 60;
  expect(first.snapshot().uniqueWatchedSeconds).toBe(5);
  expect(second.snapshot().coverage).toBe(0);
  expect(first.reset().coverage).toBe(0);
  expect(() => createTrailerWatchTracker({ durationSec: Infinity })).toThrow();
  expect(() => createTrailerWatchTracker({ durationSec: 0 })).toThrow();
  expect(() => first.note({ event: 'unknown' })).toThrow();
});
