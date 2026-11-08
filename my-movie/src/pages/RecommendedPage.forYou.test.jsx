import React from 'react';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RecommendedPage from './RecommendedPage';
import { useForYouFeed } from '../hooks/useForYouFeed';
import { fetchViewerHomeFeedPage } from '../api/homeFeedApi';

let mockAuth;
let mockScreen = 8;
const mockRoute = { pathname: '/recommended', search: '' };
const mockCatalog = {
  allMovies: [],
  allGenres: [],
  getCategoryById: () => null,
  moviesLoading: false,
  sections: [],
};
const mockTrigger = { enabled: false, onLoadMore: () => {} };

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key }),
}));
jest.mock('react-router-dom', () => ({
  useParams: () => ({}),
  useLocation: () => mockRoute,
  useSearchParams: () => [new URLSearchParams(mockRoute.search)],
}), { virtual: true });
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
  getWatchHistory: () => [],
}));
jest.mock('../context/MoviesApiContext', () => ({
  useMoviesApi: () => mockCatalog,
}));
jest.mock('../components/TopRatedContent/TopRatedContent', () => ({
  getTopRatedMovies: () => [],
}));
jest.mock('../hooks/useSimilarMovies', () => ({
  useSimilarMovies: () => ({ movies: [], isLoading: false }),
}));
jest.mock('../hooks/useMostWatchedMovies', () => ({
  useMostWatchedMovies: () => ({ movies: [], loading: false }),
}));
jest.mock('../paged-list/useVisibleCount', () => ({
  useVisibleScreen: () => mockScreen,
}));
jest.mock('../paged-list/useLoadMoreTrigger', () => ({
  useLoadMoreTrigger: ({ enabled, onLoadMore }) => {
    mockTrigger.enabled = enabled;
    mockTrigger.onLoadMore = onLoadMore;
    return { sentinelRef: () => {} };
  },
}));
jest.mock('../components/Filters', () => (props) => (
  <button type="button" onClick={() => props.onRatingSelect(8)}>rating</button>
));
jest.mock('../components/Movies/Movies', () => (props) => (
  <div>
    <span data-testid="loading">{String(Boolean(props.isLoading))}</span>
    <span data-testid="tail">{props.tailCount || 0}</span>
    {(props.filteredMovies || []).map((movie) => (
      <span key={movie.id || movie.movieId} data-testid="card">{movie.id}</span>
    ))}
  </div>
));

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
    rating: 6,
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
  mockScreen = 8;
  mockRoute.pathname = '/recommended';
  mockRoute.search = '';
  mockCatalog.allMovies = [];
  mockCatalog.allGenres = [];
  mockCatalog.moviesLoading = false;
  mockTrigger.enabled = false;
  mockTrigger.onLoadMore = () => {};
});

test('a home page of five stays on screen and the next request continues', async () => {
  let releaseNext;
  fetchViewerHomeFeedPage.mockImplementation(({ offset, limit }) => {
    if (offset === 0) {
      return Promise.resolve(page([1, 2, 3, 4, 5], { offset, hasMore: true }));
    }
    return new Promise((resolve) => {
      releaseNext = () => resolve(page(
        Array.from({ length: limit }, (_, index) => offset + index + 1),
        { offset, hasMore: true }
      ));
    });
  });

  const { wrapper } = wrapperFor();
  const home = renderHook(
    () => useForYouFeed({ maxItems: 10, getLimit: () => 5 }),
    { wrapper }
  );
  await waitFor(() => expect(home.result.current.items).toHaveLength(5));
  home.unmount();

  render(<RecommendedPage />, { wrapper });
  await waitFor(() => expect(screen.getAllByTestId('card')).toHaveLength(5));
  expect(fetchViewerHomeFeedPage).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('tail').textContent).toBe('0');

  await act(async () => {
    mockTrigger.onLoadMore();
  });
  await waitFor(() => expect(screen.getByTestId('tail').textContent).toBe('8'));
  expect(fetchViewerHomeFeedPage).toHaveBeenCalledTimes(2);
  expect(fetchViewerHomeFeedPage.mock.calls[1][0]).toMatchObject({ offset: 5, limit: 8 });
  expect(fetchViewerHomeFeedPage.mock.calls[1][0].genre).toBeUndefined();

  await act(async () => {
    releaseNext();
  });
  await waitFor(() => expect(screen.getAllByTestId('card')).toHaveLength(13));
  expect(screen.getByTestId('tail').textContent).toBe('0');
});

test('a rating choice does not change this feed', async () => {
  fetchViewerHomeFeedPage.mockResolvedValue(page([1, 2, 3, 4, 5], { offset: 0, hasMore: true }));
  const { wrapper } = wrapperFor();
  render(<RecommendedPage />, { wrapper });
  await waitFor(() => expect(screen.getAllByTestId('card')).toHaveLength(5));

  act(() => {
    screen.getByText('rating').click();
  });
  expect(screen.getAllByTestId('card')).toHaveLength(5);
  expect(fetchViewerHomeFeedPage).toHaveBeenCalledTimes(1);
  expect(fetchViewerHomeFeedPage.mock.calls[0][0]).toMatchObject({ offset: 0, limit: 8 });
});

test('a genre address keeps the catalog list', async () => {
  mockRoute.search = '?genre=action';
  mockCatalog.allGenres = [{ filterGenre: 'action' }];
  mockCatalog.allMovies = [
    { id: 9, filterGenre: ['action'], title: { uz: 'A' }, rating: 7 },
    { id: 4, filterGenre: ['drama'], title: { uz: 'D' }, rating: 7 },
  ];
  const { wrapper } = wrapperFor();
  render(<RecommendedPage />, { wrapper });
  await waitFor(() => expect(screen.getAllByTestId('card').map((node) => node.textContent)).toEqual(['9']));
  expect(fetchViewerHomeFeedPage).not.toHaveBeenCalled();
});
