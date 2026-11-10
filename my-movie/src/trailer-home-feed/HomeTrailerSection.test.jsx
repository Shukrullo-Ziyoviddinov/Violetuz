import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomeTrailerSection from './HomeTrailerSection';
import { fetchTrailerFeedPage } from './feedApi';
import { resetTrailerFeedGate } from './trailerFeedGate';
import { TrailerFeedProvider } from './TrailerFeedContext';
import HomeTrailerRows from './HomeTrailerRows';

let mockAuth = { ready: false, logged: false };
let mockVisible = 10;
let queryClient;
const PAGE = `${'a'.repeat(48)}:0`;
jest.mock('../store/hooks', () => ({ useAppSelector: (selector) => selector(mockAuth) }));
jest.mock('../store/slices/userSlice', () => ({ selectAuthReady: (state) => state.ready, selectIsLoggedIn: (state) => state.logged, selectProfile: () => ({ id: 'account-a' }) }));
jest.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: '/' }) }), { virtual: true });
jest.mock('../components/ShowMoreButton/ShowMoreButton', () => ({ to }) => <button data-to={to}>Barchasi</button>);
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, options) => options.defaultValue }) }));
jest.mock('./feedApi', () => ({ fetchTrailerFeedPage: jest.fn() }));
jest.mock('./TrailerHomeCard', () => ({ __esModule: true,
  default: ({ item }) => <a href={`/movie/${item.movieId}/trailer?trailerId=${item.id}`}>{item.title}</a>,
  TrailerHomeCardSkeleton: () => <div aria-hidden="true" /> }));
jest.mock('../components/HorizontalScroll/HorizontalScroll', () => ({ children, onNearEnd }) => (
  <div>{onNearEnd ? <button type="button" onClick={onNearEnd}>near</button> : null}{children}</div>
));
jest.mock('../paged-list/visibleCount', () => ({ measureVisibleCount: () => mockVisible }));

const renderFeed = (ui) => render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);

beforeEach(() => {
  jest.clearAllMocks();
  resetTrailerFeedGate();
  mockAuth = { ready: false, logged: false };
  mockVisible = 10;
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

test('waits for auth, then loads guest trailers and opens existing trailer route', async () => {
  fetchTrailerFeedPage.mockResolvedValue({ items: [{ key: '12-3', movieId: 12, id: 3, title: 'Trailer' }], pageCursor: PAGE, hasMore: false });
  const { rerender } = renderFeed(<TrailerFeedProvider><HomeTrailerSection /></TrailerFeedProvider>);
  expect(fetchTrailerFeedPage).not.toHaveBeenCalled();
  mockAuth = { ready: true, logged: false };
  rerender(<QueryClientProvider client={queryClient}><TrailerFeedProvider><HomeTrailerSection /></TrailerFeedProvider></QueryClientProvider>);
  const link = await screen.findByRole('link', { name: 'Trailer' });
  expect(link.getAttribute('href')).toBe('/movie/12/trailer?trailerId=3');
  expect(fetchTrailerFeedPage.mock.calls[0][0].isLoggedIn).toBe(false);
});

test('auth switch aborts old request and removes guest cards; failed feed hides section', async () => {
  fetchTrailerFeedPage.mockResolvedValue({ items: [{ key: '1-1', movieId: 1, id: 1, title: 'Guest trailer' }], pageCursor: PAGE, hasMore: false });
  mockAuth = { ready: true, logged: false };
  const { rerender } = renderFeed(<TrailerFeedProvider><HomeTrailerSection /></TrailerFeedProvider>);
  await screen.findByText('Guest trailer');
  fetchTrailerFeedPage.mockRejectedValue(new Error('offline'));
  mockAuth = { ready: true, logged: true };
  rerender(<QueryClientProvider client={queryClient}><TrailerFeedProvider><HomeTrailerSection /></TrailerFeedProvider></QueryClientProvider>);
  expect(screen.queryByText('Guest trailer')).toBeNull();
  await waitFor(() => expect(screen.queryByRole('region')).toBeNull(), { timeout: 4000 });
  expect(fetchTrailerFeedPage.mock.calls.some((call) => call[0].isLoggedIn === true)).toBe(true);
});

const sliceMock = (items) => async ({ offset = 0, limit }) => {
  const end = limit == null ? items.length : offset + limit;
  const slice = items.slice(offset, end);
  return { items: slice, pageCursor: PAGE, hasMore: end < items.length, nextCursor: null, nextOffset: offset + slice.length };
};

test('one ranked page is read in windows and the four blocks keep that order', async () => {
  mockAuth = { ready: true, logged: false };
  const items = Array.from({ length: 40 }, (_, index) => ({ key: `${index + 1}-1`, movieId: index + 1, id: 1, title: `Trailer ${index + 1}` }));
  fetchTrailerFeedPage.mockImplementation(sliceMock(items));
  const { container } = renderFeed(<TrailerFeedProvider><HomeTrailerRows>
    {Array.from({ length: 6 }, (_, index) => <div key={index} data-movie-row={index}>Movies</div>)}
  </HomeTrailerRows></TrailerFeedProvider>);
  await screen.findByText('Trailer 40');
  expect(fetchTrailerFeedPage).toHaveBeenCalledTimes(4);
  const byOffset = (offset) => fetchTrailerFeedPage.mock.calls.find((call) => call[0].offset === offset);
  expect(byOffset(0)[0].limit).toBe(10);
  expect(byOffset(10)[0].limit).toBe(10);
  expect(byOffset(20)[0].limit).toBe(10);
  expect(byOffset(30)[0].limit).toBe(10);
  expect(fetchTrailerFeedPage.mock.calls.filter((call) => call[0].cursor == null)).toHaveLength(1);
  expect(fetchTrailerFeedPage.mock.calls.filter((call) => call[0].cursor === PAGE)).toHaveLength(3);
  const sections = [...container.querySelectorAll('[data-trailer-block]')];
  expect(sections).toHaveLength(4);
  sections.forEach((section, index) => {
    expect(section.querySelectorAll('a')).toHaveLength(10);
    expect(section.querySelector('a').textContent).toBe(`Trailer ${index * 10 + 1}`);
    expect(section.querySelector('button[data-to]').dataset.to).toBe('/recommended/trailers');
  });
  expect([...container.querySelectorAll('a')].map((a) => a.href).length).toBe(new Set([...container.querySelectorAll('a')].map((a) => a.href)).size);
  expect([...container.children].filter((node) => node.hasAttribute('data-trailer-block')).map((node) => [...container.children].indexOf(node))).toEqual([0, 3, 6, 9]);
});

test('lead row asks for the visible slice, then the next slice, and stops at ten', async () => {
  mockVisible = 4;
  mockAuth = { ready: true, logged: false };
  const items = Array.from({ length: 40 }, (_, index) => ({ key: `${index + 1}-1`, movieId: index + 1, id: 1, title: `Trailer ${index + 1}` }));
  fetchTrailerFeedPage.mockImplementation(sliceMock(items));
  renderFeed(<TrailerFeedProvider><HomeTrailerSection blockIndex={0} /></TrailerFeedProvider>);
  await screen.findByText('Trailer 4');
  expect(screen.queryByText('Trailer 5')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'near' }));
  await screen.findByText('Trailer 8');
  expect(screen.queryByText('Trailer 9')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'near' }));
  await screen.findByText('Trailer 10');
  expect(screen.queryByText('Trailer 11')).toBeNull();
  const lead = fetchTrailerFeedPage.mock.calls.filter((call) => call[0].limit <= 4);
  expect(lead.map((call) => [call[0].offset, call[0].limit])).toEqual([[0, 4], [4, 4], [8, 2]]);
  expect(lead[0][0].cursor).toBeUndefined();
  expect(lead[1][0].cursor).toBe(PAGE);
  expect(lead[2][0].cursor).toBe(PAGE);
});

test('second row reads its own window, then the next slice, and stops before the third row', async () => {
  mockVisible = 4;
  mockAuth = { ready: true, logged: false };
  const items = Array.from({ length: 40 }, (_, index) => ({ key: `${index + 1}-1`, movieId: index + 1, id: 1, title: `Trailer ${index + 1}` }));
  fetchTrailerFeedPage.mockImplementation(sliceMock(items));
  renderFeed(<TrailerFeedProvider><HomeTrailerSection blockIndex={1} /></TrailerFeedProvider>);
  await screen.findByText('Trailer 14');
  expect(screen.queryByText('Trailer 10')).toBeNull();
  expect(screen.queryByText('Trailer 15')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'near' }));
  await screen.findByText('Trailer 18');
  expect(screen.queryByText('Trailer 19')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'near' }));
  await screen.findByText('Trailer 20');
  expect(screen.queryByText('Trailer 21')).toBeNull();
  const row = fetchTrailerFeedPage.mock.calls.filter((call) => call[0].offset >= 10 && call[0].limit <= 4);
  expect(row.map((call) => [call[0].offset, call[0].limit])).toEqual([[10, 4], [14, 4], [18, 2]]);
  expect(row[0][0].cursor).toBeUndefined();
  expect(row.slice(1).every((call) => call[0].cursor === PAGE)).toBe(true);
});

test('third row reads its own window, then the next slice, and stops before the fourth row', async () => {
  mockVisible = 4;
  mockAuth = { ready: true, logged: false };
  const items = Array.from({ length: 40 }, (_, index) => ({ key: `${index + 1}-1`, movieId: index + 1, id: 1, title: `Trailer ${index + 1}` }));
  fetchTrailerFeedPage.mockImplementation(sliceMock(items));
  renderFeed(<TrailerFeedProvider><HomeTrailerSection blockIndex={2} /></TrailerFeedProvider>);
  await screen.findByText('Trailer 24');
  expect(screen.queryByText('Trailer 20')).toBeNull();
  expect(screen.queryByText('Trailer 25')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'near' }));
  await screen.findByText('Trailer 28');
  expect(screen.queryByText('Trailer 29')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'near' }));
  await screen.findByText('Trailer 30');
  expect(screen.queryByText('Trailer 31')).toBeNull();
  const row = fetchTrailerFeedPage.mock.calls.filter((call) => call[0].offset >= 20 && call[0].limit <= 4);
  expect(row.map((call) => [call[0].offset, call[0].limit])).toEqual([[20, 4], [24, 4], [28, 2]]);
  expect(row[0][0].cursor).toBeUndefined();
  expect(row.slice(1).every((call) => call[0].cursor === PAGE)).toBe(true);
});

test('fourth row reads the last window, then the next slice, and stops at the end of the page', async () => {
  mockVisible = 4;
  mockAuth = { ready: true, logged: false };
  const items = Array.from({ length: 40 }, (_, index) => ({ key: `${index + 1}-1`, movieId: index + 1, id: 1, title: `Trailer ${index + 1}` }));
  fetchTrailerFeedPage.mockImplementation(sliceMock(items));
  renderFeed(<TrailerFeedProvider><HomeTrailerSection blockIndex={3} /></TrailerFeedProvider>);
  await screen.findByText('Trailer 34');
  expect(screen.queryByText('Trailer 30')).toBeNull();
  expect(screen.queryByText('Trailer 35')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'near' }));
  await screen.findByText('Trailer 38');
  expect(screen.queryByText('Trailer 39')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'near' }));
  await screen.findByText('Trailer 40');
  expect(screen.queryByText('Trailer 41')).toBeNull();
  const row = fetchTrailerFeedPage.mock.calls.filter((call) => call[0].offset >= 30 && call[0].limit <= 4);
  expect(row.map((call) => [call[0].offset, call[0].limit])).toEqual([[30, 4], [34, 4], [38, 2]]);
  expect(row[0][0].cursor).toBeUndefined();
  expect(row.slice(1).every((call) => call[0].cursor === PAGE)).toBe(true);
});
