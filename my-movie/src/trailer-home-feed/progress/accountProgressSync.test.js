import { attachAccountProgressSync, queueAccountProgress } from './accountProgressSync';
import { saveTrailerProgress } from './trailerProgressApi';
jest.mock('./trailerProgressApi', () => ({ saveTrailerProgress: jest.fn() }));
jest.mock('../../store/slices/userSlice', () => ({
  selectAuthReady: (state) => state.ready, selectIsLoggedIn: (state) => state.logged,
  selectProfile: (state) => ({ id: state.id }),
}));
const report = { movieId: 1, trailerId: 2, sessionId: 'session_1234567890123456', durationSec: 60,
  intervals: [[0, 5]], realWatchedSeconds: 5, totalPlayedSeconds: 5 };
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
let state;
let listener;
let detach;
const store = { getState: () => state, subscribe: (fn) => { listener = fn; return () => {}; } };
beforeEach(() => {
  jest.useFakeTimers(); localStorage.clear(); jest.clearAllMocks();
  state = { ready: true, logged: true, id: 'a' };
  saveTrailerProgress.mockResolvedValue({ stored: 'account' });
});
afterEach(() => { detach?.(); jest.useRealTimers(); });

test('writes synchronously, retries after online and resumes the same account queue when reopened without playing', async () => {
  saveTrailerProgress.mockRejectedValue(new Error('offline'));
  detach = attachAccountProgressSync(store);
  await settle();
  queueAccountProgress('a', report);
  expect(localStorage.length).toBe(1);
  await settle();
  saveTrailerProgress.mockResolvedValue({ stored: 'account' });
  window.dispatchEvent(new Event('online'));
  await settle();
  expect(localStorage.length).toBe(0);
  expect(saveTrailerProgress.mock.calls.at(-1)[0].accountId).toBe('a');
  state = { ready: true, logged: false };
  listener();
  await settle();
  queueAccountProgress('a', report);
  detach();
  await settle();
  state = { ready: true, logged: true, id: 'a' };
  detach = attachAccountProgressSync(store);
  await settle();
  expect(localStorage.length).toBe(0);
});

test('timer retries failed saves while playback is paused; another account never sends the old queue', async () => {
  detach = attachAccountProgressSync(store);
  await settle();
  saveTrailerProgress.mockRejectedValue(new Error('offline'));
  queueAccountProgress('a', report);
  await settle();
  state = { ready: true, logged: true, id: 'b' };
  listener();
  await settle();
  saveTrailerProgress.mockClear().mockResolvedValue({ stored: 'account' });
  jest.advanceTimersByTime(15000);
  await settle();
  expect(saveTrailerProgress).not.toHaveBeenCalled();
  expect(localStorage.length).toBe(1);
  state = { ready: true, logged: true, id: 'a' };
  listener();
  await settle();
  expect(saveTrailerProgress).toHaveBeenCalledTimes(1);
  expect(localStorage.length).toBe(0);
});
