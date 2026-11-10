import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import WeeklyTopMovies from './WeeklyTopMovies';

let mockVisible = 4;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key, fallback) => fallback || _key }),
}));
jest.mock('react-router-dom', () => ({ useNavigate: () => () => {} }), { virtual: true });
jest.mock('../../context/WishlistContext', () => ({
  useWishlist: () => ({ toggleWishlist: () => {}, isInWishlist: () => false }),
}));
jest.mock('../../context/ContentLanguageContext', () => ({
  useContentLanguage: () => ({ contentLang: 'uz' }),
}));

const mockCatalog = Array.from({ length: 10 }, (_, index) => ({
  id: String(index + 1),
  title: `Hafta ${index + 1}`,
  homeImg: { uz: `/hafta${index + 1}.jpg` },
}));

jest.mock('../../context/MoviesApiContext', () => ({
  useMoviesApi: () => ({ allMovies: mockCatalog, moviesLoading: false }),
}));
jest.mock('../../hooks/useWeeklyTopMovies', () => ({
  useWeeklyTopMovies: () => ({
    loading: false,
    movies: mockCatalog.map((movie, index) => ({ movieId: movie.id, rank: index + 1 })),
  }),
}));
jest.mock('../../paged-list/useVisibleCount', () => ({
  useVisibleCount: () => mockVisible,
}));
jest.mock('../HorizontalScroll/HorizontalScroll', () => ({ children, onNearEnd }) => (
  <div>
    {onNearEnd ? <button type="button" onClick={onNearEnd}>near</button> : null}
    {children}
  </div>
));

beforeEach(() => { mockVisible = 4; });

test('weekly top reveals the ranked ten by scroll and has no more button', () => {
  const view = render(<WeeklyTopMovies />);
  expect(view.queryByRole('button', { name: /Ko‘proq|Ko'proq/ })).toBeNull();
  expect(view.getAllByText(/Hafta /).map((node) => node.textContent)).toEqual([
    'Hafta 1', 'Hafta 2', 'Hafta 3', 'Hafta 4',
  ]);
  fireEvent.click(view.getByRole('button', { name: 'near' }));
  expect(view.getAllByText(/Hafta /)).toHaveLength(8);
  fireEvent.click(view.getByRole('button', { name: 'near' }));
  expect(view.getAllByText(/Hafta /).map((node) => node.textContent)).toEqual(
    mockCatalog.map((movie) => movie.title)
  );
  fireEvent.click(view.getByRole('button', { name: 'near' }));
  expect(view.getAllByText(/Hafta /)).toHaveLength(10);
  expect(view.queryByRole('button', { name: /Ko‘proq|Ko'proq/ })).toBeNull();
});
