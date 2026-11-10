import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import Movies from './Movies';

let mockVisible = 4;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));
jest.mock('react-router-dom', () => ({ useNavigate: () => () => {} }), { virtual: true });
jest.mock('../../context/WishlistContext', () => ({
  useWishlist: () => ({ toggleWishlist: () => {}, isInWishlist: () => false }),
}));
jest.mock('../../context/ContentLanguageContext', () => ({
  useContentLanguage: () => ({ contentLang: 'uz' }),
}));
jest.mock('../../context/MoviesApiContext', () => ({
  useMoviesApi: () => ({ allMovies: [], moviesLoading: false }),
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
jest.mock('../ShowMoreButton/ShowMoreButton', () => {
  const getDisplayItems = (items, limit = 10) => (
    !Array.isArray(items) ? [] : limit == null ? items : items.slice(0, limit)
  );
  return {
    __esModule: true,
    default: ({ to }) => <button data-to={to}>Ko‘proq</button>,
    getDisplayItems,
    shouldShowMore: () => true,
    DEFAULT_LIMIT: 10,
  };
});

const movies = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  title: `Drama ${index + 1}`,
  homeImg: { uz: `/d${index + 1}.jpg` },
}));

beforeEach(() => { mockVisible = 4; });

test('korea row reveals its own ranked prefix up to ten', () => {
  const view = render(
    <Movies
      sectionType="koreaDrama"
      filteredMovies={movies}
      limit={10}
      showHorizontalScroll
      revealVisible
      isLoading={false}
      moreTo="/category/koreaDrama"
    />
  );
  expect(view.getAllByText(/Drama /)).toHaveLength(4);
  fireEvent.click(view.getByRole('button', { name: 'near' }));
  expect(view.getAllByText(/Drama /)).toHaveLength(8);
  fireEvent.click(view.getByRole('button', { name: 'near' }));
  expect(view.getAllByText(/Drama /).map((node) => node.textContent)).toEqual(
    movies.map((movie) => movie.title)
  );
  fireEvent.click(view.getByRole('button', { name: 'near' }));
  expect(view.getAllByText(/Drama /)).toHaveLength(10);
});

test('other rows still show the full home limit at once', () => {
  const view = render(
    <Movies
      sectionType="actionMovies"
      filteredMovies={movies}
      limit={10}
      showHorizontalScroll
      isLoading={false}
    />
  );
  expect(view.getAllByText(/Drama /)).toHaveLength(10);
  expect(view.queryByRole('button', { name: 'near' })).toBeNull();
});
