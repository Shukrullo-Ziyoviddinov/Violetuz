import { createGuestTrailerProgressStore, GUEST_TRAILER_PROGRESS_PREFIX } from './guestTrailerProgress';
import { saveTrailerProgress, readTrailerProgress } from './trailerProgressApi';

const report = (seconds = 10, patch = {}) => ({ movieId: 1, trailerId: 2, sessionId: 'session_0000000001',
  durationSec: 60, intervals: seconds ? [[0, seconds]] : [], realWatchedSeconds: seconds, totalPlayedSeconds: seconds, ...patch });

beforeEach(() => { localStorage.clear(); global.fetch = jest.fn(); });
afterEach(() => { delete global.fetch; });

test('guest retries and stale snapshots do not inflate totals or bump history timestamps', () => {
  const store = createGuestTrailerProgressStore({ now: () => 100 });
  store.save(report(5));
  store.save(report(10));
  expect(store.save(report(10)).changed).toBe(false);
  expect(store.save(report(5)).changed).toBe(false);
  expect(store.read(1, 2).realWatchedSeconds).toBe(10);
  expect(store.history()).toHaveLength(1);
  expect(store.history()[0].updatedAt).toBe(100);
  expect(store.read(1, 3).coverage).toBe(0);
  expect(fetch).not.toHaveBeenCalled();
});

test('first receipt time remains stable when cumulative progress advances', () => {
  let clock = 100;
  const store = createGuestTrailerProgressStore({ now: () => clock });
  store.save(report(5));
  clock = 500;
  store.save(report(10));
  expect(store.history()[0].createdAt).toBe(100);
  expect(store.history()[0].updatedAt).toBe(500);
  clock = 900;
  store.save(report(5));
  expect(store.history()[0].updatedAt).toBe(500);
});

test('separate playback sessions add actual replay time without duplicating coverage', () => {
  const firstTab = createGuestTrailerProgressStore();
  const secondTab = createGuestTrailerProgressStore();
  firstTab.save(report(10));
  secondTab.save(report(10, { sessionId: 'session_0000000002' }));
  expect(firstTab.read(1, 2).realWatchedSeconds).toBe(20);
  expect(firstTab.read(1, 2).coverage).toBeCloseTo(1 / 6);
  expect(firstTab.history()).toHaveLength(2);
});

test('corrupt storage is ignored and unrelated movie history is preserved', () => {
  localStorage.setItem('movie-progress', 'existing movie data');
  localStorage.setItem(`${GUEST_TRAILER_PROGRESS_PREFIX}invalid`, '{broken');
  const key = `${GUEST_TRAILER_PROGRESS_PREFIX}1:2:session_0000000001`;
  localStorage.setItem(key, JSON.stringify({ progress: { bad: true } }));
  const store = createGuestTrailerProgressStore();
  expect(store.history()).toEqual([]);
  expect(store.save(report(5)).ok).toBe(true);
  expect(store.read(1, 2).realWatchedSeconds).toBe(5);
  expect(localStorage.getItem('movie-progress')).toBe('existing movie data');
});

test('storage denial is reported without sending guest data to the server', async () => {
  const store = createGuestTrailerProgressStore({ storage: { getItem: () => null, setItem: () => { throw new Error('quota'); } } });
  expect(store.save(report(5)).ok).toBe(false);
  expect(fetch).not.toHaveBeenCalled();
  await saveTrailerProgress({ isLoggedIn: false, report: report(10) });
  expect(fetch).not.toHaveBeenCalled();
});

test('guest storage stays bounded to 200 sessions', () => {
  let clock = 0;
  const store = createGuestTrailerProgressStore({ now: () => ++clock });
  for (let i = 0; i < 205; i += 1) store.save(report(1, { sessionId: `session_${String(i).padStart(16, '0')}` }));
  expect(store.history()).toHaveLength(200);
  expect(store.read(1, 2).realWatchedSeconds).toBe(200);
  expect(store.read(1, 2).coverage).toBeCloseTo(1 / 60);
});

test('account save sends only the provided snapshot, never pre-existing guest history', async () => {
  await saveTrailerProgress({ isLoggedIn: false, report: report(10) });
  fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { changed: true } }) });
  const result = await saveTrailerProgress({ isLoggedIn: true, report: report(5, { sessionId: 'account_session_0001' }) });
  expect(result.stored).toBe('account');
  expect(fetch.mock.calls[0][0]).toContain('/trailer-home-progress');
  const payload = JSON.parse(fetch.mock.calls[0][1].body);
  expect(payload.sessionId).toBe('account_session_0001');
  expect(payload.realWatchedSeconds).toBe(5);
  expect((await readTrailerProgress({ isLoggedIn: false, movieId: 1, trailerId: 2 })).realWatchedSeconds).toBe(10);
});

test('account failures do not fall back to guest storage; unresolved auth is rejected', async () => {
  fetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({ success: false, message: 'Sign in' }) });
  await expect(saveTrailerProgress({ isLoggedIn: true, report: report(5) })).rejects.toMatchObject({ status: 401 });
  expect(createGuestTrailerProgressStore().history()).toEqual([]);
  await expect(saveTrailerProgress({ report: report(5) })).rejects.toThrow('authentication');
});
