import { createAccountProgressOutbox, ACCOUNT_PROGRESS_OUTBOX_PREFIX } from './accountProgressOutbox';

const report = (seconds) => ({ movieId: 1, trailerId: 2, sessionId: 'session_1234567890123456',
  durationSec: 60, intervals: [[0, seconds]], realWatchedSeconds: seconds, totalPlayedSeconds: seconds });
let owner;
let send;
const create = () => createAccountProgressOutbox({ storage: localStorage, currentAccount: () => owner, send });
beforeEach(() => { localStorage.clear(); owner = 'a'; send = jest.fn().mockResolvedValue({ stored: 'account' }); });

test('offline snapshots survive a new runtime; only confirmed sends remove them and replay keeps session identity', async () => {
  send.mockRejectedValueOnce(new Error('offline'));
  const first = create();
  first.enqueue('a', report(5));
  await first.flush();
  expect(localStorage.length).toBe(1);
  const reopened = create();
  reopened.enqueue('a', report(8));
  await reopened.flush();
  expect(send.mock.calls.map(([entry]) => entry.sessionId)).toEqual([report(5).sessionId, report(5).sessionId]);
  expect(send.mock.calls[1][0].totalPlayedSeconds).toBe(8);
  expect(localStorage.length).toBe(0);
});

test('a new snapshot written during an in-flight save survives acknowledgement of the older snapshot', async () => {
  let resolve;
  send.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  const outbox = create();
  outbox.enqueue('a', report(5));
  const flight = outbox.flush();
  outbox.enqueue('a', report(9));
  resolve();
  await flight;
  expect(localStorage.length).toBe(1);
  await outbox.flush();
  expect(send.mock.calls[1][0].totalPlayedSeconds).toBe(9);
  expect(localStorage.length).toBe(0);
});

test('account switch, logout and cancellation retain old-account records without sending them as another viewer', async () => {
  let resolve;
  send.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  const outbox = create();
  outbox.enqueue('a', report(5));
  const flight = outbox.flush();
  owner = 'b';
  outbox.cancel();
  resolve();
  await flight;
  await outbox.flush();
  expect(send).toHaveBeenCalledTimes(1);
  expect(localStorage.length).toBe(1);
  owner = null;
  await outbox.flush();
  expect(send).toHaveBeenCalledTimes(1);
  owner = 'a';
  await outbox.flush();
  expect(localStorage.length).toBe(0);
});

test('old snapshots cannot overwrite newer progress and unrelated storage is untouched', async () => {
  localStorage.setItem('movie-history', 'existing');
  localStorage.setItem(`${ACCOUNT_PROGRESS_OUTBOX_PREFIX}broken`, '{');
  const outbox = create();
  outbox.enqueue('a', report(9));
  outbox.enqueue('a', report(5));
  await outbox.flush();
  expect(send.mock.calls[0][0].totalPlayedSeconds).toBe(9);
  expect(localStorage.getItem('movie-history')).toBe('existing');
  expect(localStorage.getItem(`${ACCOUNT_PROGRESS_OUTBOX_PREFIX}broken`)).toBe('{');
});

test('storage failure is reported instead of silently discarding the unsent report', () => {
  const outbox = createAccountProgressOutbox({ storage: { getItem: () => null, setItem: () => { throw new Error('quota'); } },
    currentAccount: () => owner, send });
  expect(() => outbox.enqueue('a', report(5))).toThrow('quota');
  expect(send).not.toHaveBeenCalled();
});

test('a removed video is discarded on 404 and later videos still upload in the same flush', async () => {
  send.mockRejectedValueOnce(Object.assign(new Error('Movie trailer not found'), { status: 404 }));
  const outbox = create();
  outbox.enqueue('a', report(5));
  outbox.enqueue('a', { ...report(8), trailerId: 3 });
  outbox.enqueue('b', report(6));
  await outbox.flush();
  expect(send.mock.calls.map(([entry]) => entry.trailerId)).toEqual([2, 3]);
  expect(localStorage.length).toBe(1);
  owner = 'b';
  await outbox.flush();
  expect(send.mock.calls.at(-1)[2]).toBe('b');
  expect(localStorage.length).toBe(0);
});

test('a 404 response cannot delete a newer snapshot written while the request was in flight', async () => {
  let reject;
  send.mockImplementationOnce(() => new Promise((resolve, fail) => { reject = fail; }));
  const outbox = create();
  outbox.enqueue('a', report(5));
  outbox.enqueue('a', { ...report(8), trailerId: 3 });
  const flight = outbox.flush();
  outbox.enqueue('a', report(9));
  reject(Object.assign(new Error('removed'), { status: 404 }));
  await flight;
  expect(send).toHaveBeenCalledTimes(2);
  expect(localStorage.length).toBe(1);
  await outbox.flush();
  expect(send.mock.calls.at(-1)[0].totalPlayedSeconds).toBe(9);
});

test.each([400, 401, 403, 409, 429, 500, undefined])('status %s retains progress and pauses the queue for retry', async (status) => {
  send.mockRejectedValueOnce(Object.assign(new Error('retry later'), { status }));
  const outbox = create();
  outbox.enqueue('a', report(5));
  outbox.enqueue('a', { ...report(8), trailerId: 3 });
  await outbox.flush();
  expect(send).toHaveBeenCalledTimes(1);
  expect(localStorage.length).toBe(2);
  await outbox.flush();
  expect(localStorage.length).toBe(0);
});

test('an account switch during a 404 response preserves the original viewer records', async () => {
  let reject;
  send.mockImplementationOnce(() => new Promise((resolve, fail) => { reject = fail; }));
  const outbox = create();
  outbox.enqueue('a', report(5));
  const flight = outbox.flush();
  owner = 'b';
  outbox.cancel();
  reject(Object.assign(new Error('removed'), { status: 404 }));
  await flight;
  expect(localStorage.length).toBe(1);
});

test('a stalled request times out without deleting progress and permits a later retry', async () => {
  jest.useFakeTimers();
  try {
    send.mockImplementationOnce((entry, signal) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    const outbox = create();
    outbox.enqueue('a', report(5));
    const flight = outbox.flush();
    jest.advanceTimersByTime(15000);
    await flight;
    expect(localStorage.length).toBe(1);
    await outbox.flush();
    expect(localStorage.length).toBe(0);
  } finally { jest.useRealTimers(); }
});
