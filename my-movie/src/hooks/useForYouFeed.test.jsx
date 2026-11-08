import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useForYouFeed } from './useForYouFeed';
import { fetchViewerHomeFeedPage } from '../api/homeFeedApi';
import { getWatchHistory } from '../utils/localStorage/guestHistory/movieGuestHistory';
import { GUEST_MOVIE_HISTORY_CHANGED } from '../utils/localStorage/guestHistory/events';

let mockAuth;
jest.mock('../store/hooks', () => ({
  useAppSelector: (selector) => selector(mockAuth),
}));
jest.mock('../store/slices/userSlice', () => ({
  selectAuthReady: (state) => state.ready,
  selectIsLoggedIn: (state) => state.logged,
  selectProfile: (state) => ({ id: state.id }),
}));
jest.mock('../api/homeFeedApi', () => ({
  fetchViewerHomeFeedPage: jest.fn(),
}));
jest.mock('../utils/localStorage/guestHistory/movieGuestHistory', () => ({
  getWatchHistory: jest.fn(() => []),
}));

const clients = [];

const wrapperFor = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  const wrapper = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { wrapper };
};

const page = (ids, { offset, hasMore = true } = {}) => ({
  movies: ids.map((id) => ({
    movieId: String(id),
    id,
    title: { uz: `K${id}` },
    homeImg: { uz: `/${id}.jpg` },
  })),
  hasMore,
  nextOffset: offset + ids.length,
  genres: [],
  source: 'cache',
});

beforeEach(() => {
  jest.clearAllMocks();
  clients.splice(0).forEach((client) => client.clear());
  mockAuth = { ready: true, logged: true, id: 'u1' };
  getWatchHistory.mockReturnValue([]);
});

test('home and the recommendations page share one unfiltered feed', async () => {
  fetchViewerHomeFeedPage.mockImplementation(async ({ offset, limit }) => {
    if (offset === 0) return page([1, 2, 3, 4], { offset, hasMore: true });
    if (offset === 4) return page([5, 6, 7, 8, 9, 10], { offset, hasMore: true });
    return page([11, 12], { offset, hasMore: false });
  });

  const { wrapper } = wrapperFor();
  const home = renderHook(
    () => useForYouFeed({ maxItems: 10, getLimit: () => 4 }),
    { wrapper }
  );
  await waitFor(() => expect(home.result.current.items.map((item) => item.id)).toEqual([1, 2, 3, 4]));
  expect(fetchViewerHomeFeedPage).toHaveBeenCalledTimes(1);
  expect(fetchViewerHomeFeedPage.mock.calls[0][0]).toMatchObject({
    isLoggedIn: true,
    offset: 0,
    limit: 4,
  });
  expect(fetchViewerHomeFeedPage.mock.calls[0][0].genre).toBeUndefined();

  await act(async () => {
    await home.result.current.fetchNextPage(8);
  });
  expect(fetchViewerHomeFeedPage.mock.calls[1][0]).toMatchObject({ offset: 4, limit: 6 });
  expect(home.result.current.items).toHaveLength(10);
  expect(home.result.current.hasMore).toBe(false);
  await act(async () => {
    await home.result.current.fetchNextPage(4);
  });
  expect(fetchViewerHomeFeedPage).toHaveBeenCalledTimes(2);

  const recommended = renderHook(
    () => useForYouFeed({ getLimit: () => 4 }),
    { wrapper }
  );
  await waitFor(() => expect(recommended.result.current.items).toHaveLength(10));
  expect(fetchViewerHomeFeedPage).toHaveBeenCalledTimes(2);
  await act(async () => {
    await recommended.result.current.fetchNextPage(4);
  });
  expect(fetchViewerHomeFeedPage.mock.calls[2][0]).toMatchObject({ offset: 10, limit: 4 });
  expect(recommended.result.current.items.map((item) => item.id)).toEqual([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  ]);
  expect(home.result.current.items).toHaveLength(10);
});

test('a guest feed stays on its own key and follows local history', async () => {
  mockAuth = { ready: true, logged: false, id: null };
  getWatchHistory.mockReturnValue([{ m: 7, t: 1, r: 1 }]);
  fetchViewerHomeFeedPage.mockResolvedValue(page([7], { offset: 0, hasMore: false }));
  const { wrapper } = wrapperFor();
  const first = renderHook(() => useForYouFeed({ getLimit: () => 2 }), { wrapper });
  await waitFor(() => expect(first.result.current.items).toHaveLength(1));
  expect(fetchViewerHomeFeedPage.mock.calls[0][0].localHistory).toEqual([{ m: 7, t: 1, r: 1 }]);

  getWatchHistory.mockReturnValue([{ m: 7, t: 1, r: 1 }, { m: 8, t: 2, r: 1 }]);
  fetchViewerHomeFeedPage.mockResolvedValueOnce(page([8], { offset: 0, hasMore: false }));
  act(() => {
    window.dispatchEvent(new Event(GUEST_MOVIE_HISTORY_CHANGED));
  });
  await waitFor(() => expect(fetchViewerHomeFeedPage).toHaveBeenCalledTimes(2));
  expect(fetchViewerHomeFeedPage.mock.calls[1][0].localHistory).toEqual([
    { m: 7, t: 1, r: 1 },
    { m: 8, t: 2, r: 1 },
  ]);
});
