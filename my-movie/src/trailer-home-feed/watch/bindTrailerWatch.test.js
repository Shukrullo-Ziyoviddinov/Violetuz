import { bindTrailerWatch } from './bindTrailerWatch';
import { validateProgressReport } from '../progress/progressProtocol';

let video;
let now;
let save;
let stop;
beforeEach(() => {
  jest.useFakeTimers();
  Object.defineProperty(global, 'crypto', { configurable: true, value: { randomUUID: () => 'session_1234567890123456' } });
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  video = document.createElement('video');
  Object.defineProperty(video, 'duration', { configurable: true, value: 60 });
  Object.defineProperty(video, 'paused', { configurable: true, value: false });
  now = 0;
  save = jest.fn((report) => validateProgressReport(report));
  stop = bindTrailerWatch(video, { movieId: 12, trailerId: 3, save, clock: () => now });
});
afterEach(() => { stop?.(); jest.useRealTimers(); });
const advance = (seconds, rate = 1) => {
  for (let index = 0; index < seconds * 4; index++) {
    now += 250;
    video.currentTime += rate / 4;
    jest.advanceTimersByTime(250);
  }
};
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };

test('actual playback, speed changes and skips produce valid cumulative reports without skipped coverage', async () => {
  advance(2);
  video.dispatchEvent(new Event('trailer-watch-before-rate'));
  video.playbackRate = 2;
  video.dispatchEvent(new Event('ratechange'));
  advance(2, 2);
  video.dispatchEvent(new Event('trailer-watch-before-seek'));
  video.currentTime = 30;
  video.dispatchEvent(new Event('seeking'));
  video.dispatchEvent(new Event('seeked'));
  advance(2, 2);
  video.dispatchEvent(new Event('pause'));
  await flush();
  const report = save.mock.calls.at(-1)[0];
  expect(report.intervals).toEqual([[0, 6], [30, 34]]);
  expect(report.realWatchedSeconds).toBe(6);
  expect(report.totalPlayedSeconds).toBe(10);
  expect(report.movieId).toBe(12);
  expect(save.mock.calls.every(([entry]) => entry.sessionId === report.sessionId)).toBe(true);
});

test('hidden time and changed shared-media position at teardown never earn coverage', async () => {
  advance(2);
  Object.defineProperty(document, 'hidden', { configurable: true, value: true });
  document.dispatchEvent(new Event('visibilitychange'));
  advance(5);
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  document.dispatchEvent(new Event('visibilitychange'));
  advance(1);
  video.currentTime = 50;
  stop();
  await flush();
  expect(save.mock.calls.at(-1)[0].intervals).toEqual([[0, 2], [7, 8]]);
  expect(save.mock.calls.at(-1)[0].realWatchedSeconds).toBe(3);
});

test('close captures the last fractional interval synchronously before any asynchronous work', () => {
  advance(1);
  now += 125;
  video.currentTime += 0.125;
  stop();
  expect(save).toHaveBeenCalledTimes(1);
  expect(save.mock.calls[0][0].intervals).toEqual([[0, 1.125]]);
  expect(save.mock.calls[0][0].realWatchedSeconds).toBe(1.125);
});

test('before-replace closes the old trailer and ignores the new trailer position even with the same duration', () => {
  advance(1);
  now += 125;
  video.currentTime += 0.125;
  video.dispatchEvent(new Event('trailer-watch-before-replace'));
  expect(save.mock.calls[0][0].totalPlayedSeconds).toBe(1.125);
  video.currentTime = 40;
  video.dispatchEvent(new Event('playing'));
  advance(1);
  stop();
  expect(save).toHaveBeenCalledTimes(1);
});

test('an adapter awaiting its source is not sealed by the outgoing source replacement', () => {
  stop();
  let ownsMedia = false;
  stop = bindTrailerWatch(video, { movieId: 3, trailerId: 4, save, ownsMedia: () => ownsMedia, clock: () => now });
  video.dispatchEvent(new Event('trailer-watch-before-replace'));
  ownsMedia = true;
  video.dispatchEvent(new Event('loadedmetadata'));
  advance(1);
  stop();
  expect(save.mock.calls.at(-1)[0].movieId).toBe(3);
  expect(save.mock.calls.at(-1)[0].totalPlayedSeconds).toBe(1);
});
