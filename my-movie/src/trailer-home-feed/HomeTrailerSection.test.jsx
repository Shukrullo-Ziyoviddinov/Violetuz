import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import HomeTrailerSection from './HomeTrailerSection';
import { fetchTrailerFeedPage } from './feedApi';
import { TrailerFeedProvider } from './TrailerFeedContext';
import HomeTrailerRows from './HomeTrailerRows';
let mockAuth = { ready: false, logged: false };
jest.mock('../store/hooks', () => ({ useAppSelector: (selector) => selector(mockAuth) }));
jest.mock('../store/slices/userSlice', () => ({ selectAuthReady: (state) => state.ready, selectIsLoggedIn: (state) => state.logged, selectProfile: () => ({ id: 'account-a' }) }));
jest.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: '/' }) }), { virtual: true });
jest.mock('../components/ShowMoreButton/ShowMoreButton', () => ({ to }) => <button data-to={to}>Barchasi</button>);
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, options) => options.defaultValue }) }));
jest.mock('./feedApi', () => ({ fetchTrailerFeedPage: jest.fn() }));
jest.mock('./TrailerHomeCard', () => ({ __esModule: true,
  default: ({ item }) => <a href={`/movie/${item.movieId}/trailer?trailerId=${item.id}`}>{item.title}</a>,
  TrailerHomeCardSkeleton: () => <div aria-hidden="true" /> }));
jest.mock('../components/HorizontalScroll/HorizontalScroll', () => ({ children }) => <div>{children}</div>);
beforeEach(() => { jest.clearAllMocks(); mockAuth = { ready: false, logged: false }; });
test('waits for auth, then loads guest trailers and opens existing trailer route', async () => {
  fetchTrailerFeedPage.mockResolvedValue({ items: [{ key: '12-3', movieId: 12, id: 3, title: 'Trailer' }] });
  const { rerender } = render(<TrailerFeedProvider><HomeTrailerSection /></TrailerFeedProvider>);
  expect(fetchTrailerFeedPage).not.toHaveBeenCalled();
  mockAuth = { ready: true, logged: false };
  rerender(<TrailerFeedProvider><HomeTrailerSection /></TrailerFeedProvider>);
  const link = await screen.findByRole('link', { name: 'Trailer' });
  expect(link.getAttribute('href')).toBe('/movie/12/trailer?trailerId=3');
  expect(fetchTrailerFeedPage.mock.calls[0][0].isLoggedIn).toBe(false);
});
test('auth switch aborts old request and removes guest cards; failed feed hides section', async () => {
  fetchTrailerFeedPage.mockResolvedValueOnce({ items: [{ key: '1-1', movieId: 1, id: 1, title: 'Guest trailer' }] });
  mockAuth = { ready: true, logged: false };
  const { rerender } = render(<TrailerFeedProvider><HomeTrailerSection /></TrailerFeedProvider>);
  await screen.findByText('Guest trailer');
  fetchTrailerFeedPage.mockRejectedValueOnce(new Error('offline'));
  mockAuth = { ready: true, logged: true };
  rerender(<TrailerFeedProvider><HomeTrailerSection /></TrailerFeedProvider>);
  expect(screen.queryByText('Guest trailer')).toBeNull();
  expect(fetchTrailerFeedPage.mock.calls[0][0].signal.aborted).toBe(true);
  await waitFor(() => expect(screen.queryByRole('region')).toBeNull());
  expect(fetchTrailerFeedPage.mock.calls[1][0].isLoggedIn).toBe(true);
});

test('one request supplies four interleaved blocks of ten distinct trailers in ranking order', async () => {
  mockAuth = { ready: true, logged: false };
  const items = Array.from({ length: 40 }, (_, index) => ({ key: `${index + 1}-1`, movieId: index + 1, id: 1, title: `Trailer ${index + 1}` }));
  fetchTrailerFeedPage.mockResolvedValue({ items });
  const { container } = render(<TrailerFeedProvider><HomeTrailerRows>
    {Array.from({ length: 6 }, (_, index) => <div key={index} data-movie-row={index}>Movies</div>)}
  </HomeTrailerRows></TrailerFeedProvider>);
  await screen.findByText('Trailer 40');
  expect(fetchTrailerFeedPage).toHaveBeenCalledTimes(1);
  const sections = [...container.querySelectorAll('[data-trailer-block]')];
  expect(sections).toHaveLength(4);
  sections.forEach((section, index) => {
    expect(section.querySelectorAll('a')).toHaveLength(10);
    expect(section.querySelector('a').textContent).toBe(`Trailer ${index * 10 + 1}`);
    expect(section.querySelector('button').dataset.to).toBe('/recommended/trailers');
  });
  expect([...container.querySelectorAll('a')].map((a) => a.href).length).toBe(new Set([...container.querySelectorAll('a')].map((a) => a.href)).size);
  expect([...container.children].filter((node) => node.hasAttribute('data-trailer-block')).map((node) => [...container.children].indexOf(node))).toEqual([0, 3, 6, 9]);
});
