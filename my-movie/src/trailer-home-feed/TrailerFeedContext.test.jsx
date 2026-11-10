import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TrailerFeedProvider, useTrailerFeed } from './TrailerFeedContext';
import { fetchTrailerFeedPage } from './feedApi';
import { resetTrailerFeedGate } from './trailerFeedGate';
import TrailerRecommendedPage from './TrailerRecommendedPage';
let mockPath = '/';
let mockAuth = { ready: true, logged: false, id: null };
jest.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: mockPath }) }), { virtual: true });
jest.mock('../store/hooks', () => ({ useAppSelector: (selector) => selector(mockAuth) }));
jest.mock('../store/slices/userSlice', () => ({ selectAuthReady: (state) => state.ready,
  selectIsLoggedIn: (state) => state.logged, selectProfile: (state) => ({ id: state.id }) }));
jest.mock('./feedApi', () => ({ fetchTrailerFeedPage: jest.fn() }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, options) => options.defaultValue }) }));
jest.mock('./TrailerHomeCard', () => ({ __esModule: true, default: ({ item }) => <article>{item.key}</article>,
  TrailerHomeCardSkeleton: () => <div aria-hidden="true" /> }));
let queryClient;
const Probe = () => {
  const feed = useTrailerFeed();
  return <><output>{feed.items.map((item) => item.key).join(',')}</output>
    <button onClick={feed.loadMore}>next</button><button onClick={feed.refresh}>refresh</button></>;
};
const App = ({ page = false }) => <QueryClientProvider client={queryClient}><TrailerFeedProvider>{page ? <TrailerRecommendedPage /> : <Probe />}</TrailerFeedProvider></QueryClientProvider>;
beforeEach(() => {
  jest.clearAllMocks();
  resetTrailerFeedGate();
  mockPath = '/';
  mockAuth = { ready: true, logged: false, id: null };
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

test('Home to recommended preserves the first page; continuation appends without duplicates or reordering', async () => {
  const pageCursor = `${'c'.repeat(48)}:0`;
  const first = { items: [{ key: '1-1' }, { key: '2-1' }], nextCursor: 'page-2', pageCursor };
  fetchTrailerFeedPage.mockResolvedValueOnce(first);
  const { rerender } = render(<App />);
  await screen.findByText('1-1,2-1');
  expect(fetchTrailerFeedPage.mock.calls[0][0]).toMatchObject({ offset: 10, limit: 30 });
  expect(fetchTrailerFeedPage.mock.calls[0][0].cursor).toBeUndefined();
  fetchTrailerFeedPage.mockResolvedValueOnce(first);
  mockPath = '/recommended/trailers';
  rerender(<App page />);
  await waitFor(() => expect(fetchTrailerFeedPage).toHaveBeenCalledTimes(2));
  expect(fetchTrailerFeedPage.mock.calls[1][0]).toMatchObject({ cursor: pageCursor, offset: 0, limit: 40 });
  await waitFor(() => expect([...document.querySelectorAll('article')].map((node) => node.textContent)).toEqual(['1-1', '2-1']));
  fetchTrailerFeedPage.mockResolvedValueOnce({ items: [{ key: '2-1' }, { key: '3-1' }], nextCursor: null });
  fireEvent.click(screen.getByRole('button', { name: 'Ko‘proq' }));
  await screen.findByText('3-1');
  expect(fetchTrailerFeedPage.mock.calls[2][0].cursor).toBe('page-2');
  expect([...document.querySelectorAll('article')].map((node) => node.textContent)).toEqual(['1-1', '2-1', '3-1']);
  expect(screen.queryByRole('button', { name: 'Ko‘proq' })).toBeNull();
});

test('account-to-account change aborts old pagination and clears the previous viewer immediately', async () => {
  mockAuth = { ready: true, logged: true, id: 'a' };
  fetchTrailerFeedPage.mockResolvedValueOnce({ items: [{ key: 'alice' }], nextCursor: 'alice-next' });
  const { rerender } = render(<App />);
  await screen.findByText('alice');
  let resolve;
  fetchTrailerFeedPage.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  fireEvent.click(screen.getByText('next'));
  fetchTrailerFeedPage.mockResolvedValueOnce({ items: [{ key: 'bob' }], nextCursor: null });
  mockAuth = { ready: true, logged: true, id: 'b' };
  rerender(<App />);
  expect(screen.queryByText('alice')).toBeNull();
  expect(fetchTrailerFeedPage.mock.calls[1][0].signal.aborted).toBe(true);
  await screen.findByText('bob');
  resolve({ items: [{ key: 'stale-alice' }], nextCursor: null });
  await waitFor(() => expect(screen.queryByText('stale-alice')).toBeNull());
});

test('an expired continuation offers refresh and starts a new ordering without an old cursor', async () => {
  mockPath = '/recommended/trailers';
  fetchTrailerFeedPage.mockResolvedValueOnce({ items: [{ key: 'old' }], nextCursor: 'expired' });
  render(<App page />);
  await screen.findByText('old');
  fetchTrailerFeedPage.mockRejectedValueOnce(Object.assign(new Error('expired'), { status: 410 }));
  fireEvent.click(screen.getByRole('button', { name: 'Ko‘proq' }));
  await screen.findByRole('alert');
  fetchTrailerFeedPage.mockResolvedValueOnce({ items: [{ key: 'fresh' }], nextCursor: null });
  fireEvent.click(screen.getByRole('button', { name: 'Yangilash' }));
  await screen.findByText('fresh');
  expect(screen.queryByText('old')).toBeNull();
  expect(fetchTrailerFeedPage.mock.calls[2][0].cursor).toBeUndefined();
});
