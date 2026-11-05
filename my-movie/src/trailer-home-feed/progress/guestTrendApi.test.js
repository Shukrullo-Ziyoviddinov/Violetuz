import { createGuestTrendReporter } from './guestTrendApi';
const initial = { movieId: 1, trailerId: 2, sessionId: 'guest_session_00000001', durationSec: 60,
  intervals: [], realWatchedSeconds: 0, totalPlayedSeconds: 0 };
const report = { ...initial, intervals: [[0, 10]], realWatchedSeconds: 10, totalPlayedSeconds: 10 };
const play = (reporter, from = 0) => {
  for (let i = 0; i <= 40; i++) reporter.observe({ event: i ? 'sample' : 'playing', currentTime: from + i / 4,
    nowMs: i * 250, playbackRate: 1, playing: true, visible: true }, initial.sessionId);
};

test('starts a server session before reporting; historical local progress is never imported', async () => {
  const transport = jest.fn().mockResolvedValueOnce({ ticket: 'server-ticket' }).mockResolvedValue({ changed: true });
  const reporter = createGuestTrendReporter({ isGuest: () => true, transport });
  await reporter.save(report);
  expect(transport).not.toHaveBeenCalled();
  await reporter.start(initial);
  play(reporter);
  await reporter.save(report);
  expect(transport.mock.calls[0][0]).toBe('/session');
  expect(transport.mock.calls[0][1].intervals).toBeUndefined();
  expect(transport.mock.calls[1][0]).toBe('');
  expect(transport.mock.calls[1][1]).toMatchObject({ ...report, ticket: 'server-ticket' });
});

test('account login suppresses guest upload without converting history into account reports', async () => {
  let guest = true;
  const transport = jest.fn().mockResolvedValue({ ticket: 'server-ticket' });
  const reporter = createGuestTrendReporter({ isGuest: () => guest, transport });
  await reporter.start(initial);
  play(reporter);
  await reporter.save(report);
  guest = false;
  await reporter.save(report);
  expect(transport).toHaveBeenCalledTimes(2);
});

test('slow handshake excludes pre-ticket footage while local progress can keep the full history', async () => {
  let resolve;
  const transport = jest.fn().mockImplementationOnce(() => new Promise((done) => { resolve = done; })).mockResolvedValue({});
  const reporter = createGuestTrendReporter({ isGuest: () => true, transport });
  const ready = reporter.start(initial);
  for (let i = 0; i < 8; i++) await Promise.resolve();
  play(reporter);
  resolve({ ticket: 'server-ticket' });
  await ready;
  play(reporter, 20);
  await reporter.save({ ...report, intervals: [[0, 10], [20, 30]], realWatchedSeconds: 20, totalPlayedSeconds: 20 });
  expect(transport.mock.calls[1][1].intervals).toEqual([[20, 30]]);
  expect(transport.mock.calls[1][1].realWatchedSeconds).toBe(10);
});

test('offline handshake does not throw or upload an unverified history later', async () => {
  const transport = jest.fn().mockRejectedValue(new Error('offline'));
  const reporter = createGuestTrendReporter({ isGuest: () => true, transport });
  reporter.start(initial);
  await reporter.save(report);
  expect(transport).toHaveBeenCalledTimes(1);
});
