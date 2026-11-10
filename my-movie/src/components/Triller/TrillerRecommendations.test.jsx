import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TrillerSection from './TrillerSection';
import TrillerRecommendedPage from './TrillerRecommendedPage';
let mockList;
let mockVisible = 10;
jest.mock('../../hooks/useTrillerList', () => ({ useTrillerList: () => mockList }));
jest.mock('../../paged-list/useVisibleCount', () => ({ useVisibleCount: () => mockVisible }));
jest.mock('./TrillerCard', () => ({ __esModule: true,
  default: ({ triller }) => <article data-id={triller.id}>{triller.title}</article>,
  TrillerCardSkeleton: () => <div data-testid="triller-skeleton" /> }));
jest.mock('../HorizontalScroll/HorizontalScroll', () => ({ children, onNearEnd }) => (
  <div>
    {onNearEnd ? <button type="button" onClick={onNearEnd}>near</button> : null}
    {children}
  </div>
));
jest.mock('../ShowMoreButton/ShowMoreButton', () => ({ __esModule: true, DEFAULT_LIMIT: 10,
  default: ({ to }) => <a href={to}>Ko‘proq</a> }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, options) => options.defaultValue }) }));
const list = [42, 3, 18, 9, 6, 17, 8, 2, 90, 5, 1, 12].map((id) => ({ id, title: `Video ${id}` }));
beforeEach(() => {
  mockVisible = 10;
  mockList = { data: list, isPending: false, isError: false, refetch: jest.fn() };
});

test('Home shows only the first ten in server rank order and links to the dedicated page', () => {
  render(<TrillerSection />);
  expect([...document.querySelectorAll('article')].map((node) => Number(node.dataset.id))).toEqual(list.slice(0, 10).map((item) => item.id));
  expect(screen.getByRole('link', { name: 'Ko‘proq' }).getAttribute('href')).toBe('/recommended/parda-ortida');
});

test.each([0, 5, 10])('Home does not show More for %s entries', (count) => {
  mockList.data = list.slice(0, count);
  render(<TrillerSection />);
  expect(screen.queryByRole('link')).toBeNull();
  expect(document.querySelectorAll('article')).toHaveLength(count);
});

test('home reveals the ranked prefix up to ten without changing the order', () => {
  mockVisible = 4;
  render(<TrillerSection />);
  const ids = () => [...document.querySelectorAll('article')].map((node) => Number(node.dataset.id));
  expect(ids()).toEqual(list.slice(0, 4).map((item) => item.id));
  fireEvent.click(screen.getByRole('button', { name: 'near' }));
  expect(ids()).toEqual(list.slice(0, 8).map((item) => item.id));
  fireEvent.click(screen.getByRole('button', { name: 'near' }));
  expect(ids()).toEqual(list.slice(0, 10).map((item) => item.id));
});

test('recommendations render the full unchanged server ordering, including videos beyond the Home ten', () => {
  render(<TrillerRecommendedPage />);
  expect([...document.querySelectorAll('article')].map((node) => Number(node.dataset.id))).toEqual(list.map((item) => item.id));
  expect(screen.getByText('Video 12')).toBeTruthy();
});

test('the recommendations page shows skeletons while pending and retry on error', () => {
  mockList = { ...mockList, data: undefined, isPending: true };
  const { rerender } = render(<TrillerRecommendedPage />);
  expect(screen.getAllByTestId('triller-skeleton')).toHaveLength(10);
  mockList = { ...mockList, isPending: false, isError: true };
  rerender(<TrillerRecommendedPage />);
  expect(screen.queryByTestId('triller-skeleton')).toBeNull();
  expect(screen.getByRole('alert')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Qayta urinish' }));
  expect(mockList.refetch).toHaveBeenCalledTimes(1);
});
