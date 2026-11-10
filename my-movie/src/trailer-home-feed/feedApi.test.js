import { fetchTrailerHomeFeed, fetchTrailerFeedPage } from './feedApi';
jest.mock('../api/apiBase', () => ({ resolveApiBaseUrl: () => '/api' }));
jest.mock('./progress/guestTrailerProgress', () => ({ createGuestTrailerProgressStore: () => ({ history: () => [{ movieId: 1 }] }) }));
jest.mock('./signals/guestTrailerSignals', () => ({ createGuestTrailerSignalStore: () => ({ history: () => [{ type: 'open' }] }) }));
jest.mock('../utils/localStorage/guestHistory/movieGuestHistory', () => ({ getWatchHistory: () => [{ m: 2 }] }));
beforeEach(() => { global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { items: [{ key: '1-1' }] } }) }); });
test('account uses authenticated GET without uploading guest history', async () => {
  expect(await fetchTrailerHomeFeed({ isLoggedIn: true })).toEqual([{ key: '1-1' }]);
  expect(fetch.mock.calls[0][0]).toBe('/api/trailer-home-feed');
  expect(fetch.mock.calls[0][1]).toMatchObject({ method: 'GET', credentials: 'include' });
  expect(fetch.mock.calls[0][1].body).toBeUndefined();
});
test('guest posts only independent local histories', async () => {
  // Small fixture avoids the browser TextEncoder dependency in jsdom.
  const original = global.TextEncoder;
  global.TextEncoder = class { encode(value) { return { length: value.length }; } };
  try {
    await fetchTrailerHomeFeed({ isLoggedIn: false });
    expect(fetch.mock.calls[0][0]).toBe('/api/trailer-home-feed/guest');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ sessions: [{ movieId: 1 }], actions: [{ type: 'open' }], movieHistory: [{ m: 2 }] });
  } finally { global.TextEncoder = original; }
});
test('unresolved auth and failed responses never silently switch to guest', async () => {
  await expect(fetchTrailerHomeFeed({})).rejects.toThrow('authentication');
  expect(fetch).not.toHaveBeenCalled();
  fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Unauthorized' }) });
  await expect(fetchTrailerHomeFeed({ isLoggedIn: true })).rejects.toThrow('Unauthorized');
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('continuation sends an encoded cursor and retains server ranking order', async () => {
  fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true,
    data: { items: [{ key: '3-1' }, { key: '1-1' }], nextCursor: 'session:2' } }) });
  expect(await fetchTrailerFeedPage({ isLoggedIn: true, cursor: 'session:1' })).toEqual({
    items: [{ key: '3-1' }, { key: '1-1' }], nextCursor: 'session:2', pageCursor: null, hasMore: false, nextOffset: 2 });
  expect(fetch.mock.calls[0][0]).toBe('/api/trailer-home-feed?cursor=session%3A1');
});

test('window query asks for a slice and keeps the session cursor', async () => {
  fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: {
    items: [{ key: '2-1' }], nextCursor: 'session:2', pageCursor: 'session:0', hasMore: true, nextOffset: 4,
  } }) });
  expect(await fetchTrailerFeedPage({ isLoggedIn: true, cursor: 'session:0', offset: 2, limit: 2 })).toEqual({
    items: [{ key: '2-1' }], nextCursor: 'session:2', pageCursor: 'session:0', hasMore: true, nextOffset: 4 });
  expect(fetch.mock.calls[0][0]).toBe('/api/trailer-home-feed?cursor=session%3A0&offset=2&limit=2');
});
