import { createGuestTrailerSignalStore, createTrailerSignalAction, GUEST_TRAILER_SIGNAL_PREFIX } from './guestTrailerSignals';
import { saveTrailerSignal, readTrailerSignals } from './trailerSignalsApi';
import { createGuestTrailerProgressStore } from '../progress/guestTrailerProgress';

const action = (type = 'open', patch = {}) => ({ movieId: 1, trailerId: 2, type, surface: 'channel', eventId: 'event_000000000001', ...patch });
beforeEach(() => { localStorage.clear(); global.fetch = jest.fn(); });
afterEach(() => { delete global.fetch; });

test('same action retains its receipt across retries and day boundaries', () => {
  let clock = Date.parse('2026-11-05T23:59:00Z');
  const store = createGuestTrailerSignalStore({ now: () => clock });
  expect(store.save(action()).changed).toBe(true);
  expect(store.save(action()).changed).toBe(false);
  clock += 120_000;
  expect(store.save(action()).changed).toBe(false);
  expect(store.today(1, 2)).toEqual([]);
  expect(store.history()).toHaveLength(1);
});

test('different opens/surfaces coalesce into one daily feature and are separate from impressions', () => {
  const store = createGuestTrailerSignalStore();
  store.save(action());
  store.save(action('open', { eventId: 'event_000000000002', surface: 'home' }));
  store.save(action('impression', { eventId: 'event_000000000003', visibleRatio: 0.5, visibleMs: 1000 }));
  expect(store.today(1, 2).map((row) => row.type)).toEqual(['open', 'impression']);
  expect(store.today(1, 3)).toEqual([]);
});

test('weak visibility and client claims of likes or watched status are not accepted', () => {
  expect(() => createTrailerSignalAction(action('impression', { visibleRatio: 0.4, visibleMs: 10000 }))).toThrow();
  expect(() => createTrailerSignalAction(action('like'))).toThrow();
  expect(() => createTrailerSignalAction(action('meaningfulWatch'))).toThrow();
  const valid = createTrailerSignalAction(action('openMovie', { points: 999, userId: 'other' }));
  expect(valid.points).toBeUndefined();
  expect(valid.userId).toBeUndefined();
});

test('corrupt signal entries do not affect movie or progress storage', () => {
  localStorage.setItem(`${GUEST_TRAILER_SIGNAL_PREFIX}bad`, 'broken');
  localStorage.setItem(`${GUEST_TRAILER_SIGNAL_PREFIX}event_000000000001`, 'broken');
  localStorage.setItem('movie-history', 'untouched');
  const store = createGuestTrailerSignalStore();
  expect(store.history()).toEqual([]);
  store.save(action());
  expect(store.history()).toHaveLength(1);
  expect(localStorage.getItem('movie-history')).toBe('untouched');
});

test('expired history is pruned while current signals and other keys are preserved', () => {
  let clock = Date.parse('2026-01-01T12:00:00Z');
  const store = createGuestTrailerSignalStore({ now: () => clock });
  store.save(action());
  clock += 31 * 24 * 60 * 60 * 1000;
  expect(store.history()).toEqual([]);
  store.save(action('openMovie', { eventId: 'event_000000000002' }));
  expect(store.history()).toHaveLength(1);
});

test('guest API stays local and reads separately saved real watch progress', async () => {
  createGuestTrailerProgressStore().save({ movieId: 1, trailerId: 2, sessionId: 'session_0000000001', durationSec: 60,
    intervals: [[0, 20]], realWatchedSeconds: 10, totalPlayedSeconds: 20 });
  await saveTrailerSignal({ isLoggedIn: false, action: action() });
  const state = await readTrailerSignals({ isLoggedIn: false, movieId: 1, trailerId: 2 });
  expect(state.todayActions).toHaveLength(1);
  expect(state.lifetimeWatch.coverage).toBeCloseTo(1 / 3);
  expect(state.currentReaction).toBe('none');
  expect(fetch).not.toHaveBeenCalled();
});

test('account API does not import guest signals or fall back locally on failure', async () => {
  await saveTrailerSignal({ isLoggedIn: false, action: action() });
  fetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({ success: false }) });
  await expect(saveTrailerSignal({ isLoggedIn: true, action: action('openMovie', { eventId: 'event_000000000002' }) })).rejects.toMatchObject({ status: 401 });
  expect(createGuestTrailerSignalStore().history()).toHaveLength(1);
  expect(JSON.parse(fetch.mock.calls[0][1].body).type).toBe('openMovie');
  await expect(saveTrailerSignal({ action: action() })).rejects.toThrow('authentication');
});

test('storage denial does not cause network uploads', () => {
  const store = createGuestTrailerSignalStore({ storage: { getItem() { return null; }, setItem() { throw new Error('denied'); } } });
  expect(store.save(action()).ok).toBe(false);
  expect(fetch).not.toHaveBeenCalled();
});
