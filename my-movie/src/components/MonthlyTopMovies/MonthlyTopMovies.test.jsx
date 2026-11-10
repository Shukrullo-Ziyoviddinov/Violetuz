import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import MonthlyTopMovies from './MonthlyTopMovies';

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
  title: `Oy ${index + 1}`,
  homeImg: { uz: `/oy${index + 1}.jpg` },
}));

jest.mock('../../context/MoviesApiContext', () => ({
  useMoviesApi: () => ({ allMovies: mockCatalog, moviesLoading: false }),
}));
jest.mock('../../hooks/useMonthlyTopMovies', () => ({
  useMonthlyTopMovies: () => ({
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

test('monthly top reveals the ranked ten by scroll and has no more button', () => {
  const view = render(<MonthlyTopMovies />);
  expect(view.queryByRole('button', { name: /Ko‘proq|Ko'proq/ })).toBeNull();
  expect(view.getAllByText(/Oy /).map((node) => node.textContent)).toEqual([
    'Oy 1', 'Oy 2', 'Oy 3', 'Oy 4',
  ]);
  fireEvent.click(view.getByRole('button', { name: 'near' }));
  expect(view.getAllByText(/Oy /)).toHaveLength(8);
  fireEvent.click(view.getByRole('button', { name: 'near' }));
  expect(view.getAllByText(/Oy /).map((node) => node.textContent)).toEqual(
    mockCatalog.map((movie) => movie.title)
  );
  fireEvent.click(view.getByRole('button', { name: 'near' }));
  expect(view.getAllByText(/Oy /)).toHaveLength(10);
  expect(view.queryByRole('button', { name: /Ko‘proq|Ko'proq/ })).toBeNull();
});
