import React from 'react';
import { render, screen } from '@testing-library/react';
import ChanelTrailerCard, { ChanelTrailerCardSkeleton } from './ChanelTrailerCard';
let mockLoading;
jest.mock('react-router-dom', () => ({ Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a> }), { virtual: true });
jest.mock('../../context/ContentLanguageContext', () => ({ useContentLanguage: () => ({ contentLang: 'uz' }) }));
jest.mock('../../utils/useImageReady', () => ({ useImageReady: () => ({ showSkeleton: mockLoading,
  failed: false, imgRef: null, onLoad: jest.fn(), onError: jest.fn() }) }));
jest.mock('../ViewCount/ViewCount', () => () => <div className="view-count-text">42</div>);

test.each(['row', 'grid'])('%s placeholder includes preview, title and metadata skeletons without a link', (layout) => {
  const { container } = render(<ChanelTrailerCardSkeleton layout={layout} />);
  expect(container.querySelectorAll('.skeleton-loader')).toHaveLength(3);
  expect(container.querySelector('.chanel-trailer-card-preview .skeleton-loader')).not.toBeNull();
  expect(container.querySelector('.chanel-trailer-card-info .chanel-trailer-card-title .skeleton-loader')).not.toBeNull();
  expect(container.querySelector('.trailer-modal-meta-row .skeleton-loader')).not.toBeNull();
  expect(container.querySelector(`.chanel-trailer-card--${layout}`)).not.toBeNull();
  expect(container.querySelector('a')).toBeNull();
});

test('loading images hold skeletons for the title and metadata, then reveal the original trailer link', () => {
  mockLoading = true;
  const item = { movieId: 12, id: 3, title: { uz: 'Treyler' }, trillerimg: '/poster.jpg' };
  const { container, rerender } = render(<ChanelTrailerCard item={item} />);
  expect(container.querySelectorAll('.skeleton-loader')).toHaveLength(3);
  expect(screen.queryByRole('heading')).toBeNull();
  mockLoading = false;
  rerender(<ChanelTrailerCard item={item} />);
  expect(container.querySelector('.skeleton-loader')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Treyler' })).toBeTruthy();
  expect(screen.getByText('42')).toBeTruthy();
  expect(container.querySelector('a').getAttribute('href')).toBe('/movie/12/trailer?trailerId=3');
});
