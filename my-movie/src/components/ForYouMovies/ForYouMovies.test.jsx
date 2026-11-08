import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ForYouMovies from './ForYouMovies';
import { fetchViewerHomeFeedPage } from '../../api/homeFeedApi';

let mockAuth;
let mockVisibleSlots = 4;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key }),
}));
jest.mock('../../store/hooks', () => ({
  useAppSelector: (selector) => selector(mockAuth),
}));
jest.mock('../../store/slices/userSlice', () => ({
  selectAuthReady: (state) => state.ready,
  selectIsLoggedIn: (state) => state.logged,
  selectProfile: (state) => ({ id: state.id }),
}));
jest.mock('../../api/homeFeedApi', () => ({
  fetchViewerHomeFeedPage: jest.fn(),
}));
jest.mock('../../utils/localStorage/guestHistory/movieGuestHistory', () => ({
  getWatchHistory: () => [],
}));
jest.mock('../../paged-list/useVisibleCount', () => ({
  useVisibleCount: () => mockVisibleSlots,
}));
jest.mock('../HorizontalScroll/HorizontalScroll', () => ({ children, onNearEnd }) => (
  <div>
    <button type="button" onClick={onNearEnd}>near</button>
    {children}
  </div>
));
jest.mock('../ShowMoreButton/ShowMoreButton', () => ({
  __esModule: true,
  default: ({ to }) => <a href={to}>Ko‘proq</a>,
}));
jest.mock('./ForYouMovieCard', () => ({
  __esModule: true,
  default: ({ movie }) => <article data-testid="for-you-card">{movie.id}</article>,
  ForYouMovieCardSkeleton: () => <div data-testid="for-you-skeleton" />,
}));

const card = (id) => ({
  movieId: String(id),
  id,
  title: { uz: `K${id}` },
  homeImg: { uz: `/${id}.jpg` },
});

const renderRow = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ForYouMovies />
    </QueryClientProvider>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth = { ready: true, logged: true, id: 'u1' };
  mockVisibleSlots = 4;
});

test('first paint requests only the visible cards, then the next chunk on scroll, and stops at 10', async () => {
  const calls = [];
  let resolveFirst;
  let resolveNext;
  fetchViewerHomeFeedPage.mockImplementation(({ offset, limit }) => {
    calls.push({ offset, limit, genre: undefined });
    if (offset === 0) {
      return new Promise((resolve) => {
        resolveFirst = () => resolve({
          movies: [1, 2, 3, 4].map(card),
          hasMore: true,
          nextOffset: 4,
        });
      });
    }
    return new Promise((resolve) => {
      resolveNext = () => resolve({
        movies: [5, 6, 7, 8, 9, 10].map(card),
        hasMore: true,
        nextOffset: 10,
      });
    });
  });

  renderRow();
  expect(screen.getAllByTestId('for-you-skeleton')).toHaveLength(4);
  await waitFor(() => expect(calls).toEqual([{ offset: 0, limit: 4, genre: undefined }]));

  await act(async () => {
    resolveFirst();
  });
  await waitFor(() => {
    expect(screen.getAllByTestId('for-you-card').map((node) => node.textContent)).toEqual(['1', '2', '3', '4']);
  });
  expect(screen.getAllByTestId('for-you-skeleton')).toHaveLength(1);

  fireEvent.click(screen.getByRole('button', { name: 'near' }));
  await waitFor(() => expect(calls[1]).toEqual({ offset: 4, limit: 4, genre: undefined }));
  expect(screen.getAllByTestId('for-you-skeleton')).toHaveLength(4);

  await act(async () => {
    resolveNext();
  });
  await waitFor(() => expect(screen.getAllByTestId('for-you-card')).toHaveLength(10));
  expect(screen.queryByTestId('for-you-skeleton')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'near' }));
  expect(calls).toHaveLength(2);
  expect(screen.getByRole('link', { name: 'Ko‘proq' }).getAttribute('href')).toBe('/recommended');
});

test('before the width is measured only a measuring skeleton is shown', () => {
  mockVisibleSlots = 0;
  renderRow();
  expect(screen.getAllByTestId('for-you-skeleton')).toHaveLength(1);
  expect(fetchViewerHomeFeedPage).not.toHaveBeenCalled();
});
