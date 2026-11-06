import React from 'react';
import { render, screen } from '@testing-library/react';
import ChanelContentCard, { ChanelMovieCardSkeleton } from './ChanelContentCard';
let mockLoading;
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, fallback) => fallback }) }));
jest.mock('../../context/WishlistContext', () => ({ useWishlist: () => ({ toggleWishlist: jest.fn(), isInWishlist: () => false }) }));
jest.mock('../../context/ContentLanguageContext', () => ({ useContentLanguage: () => ({ contentLang: 'uz' }) }));
jest.mock('../../utils/useImageReady', () => ({ useImageReady: () => ({ showSkeleton: mockLoading,
  failed: false, imgRef: null, onLoad: jest.fn(), onError: jest.fn() }) }));
const movie = { id: 1, title: { uz: 'Kino' }, homeImg: { uz: '/poster.jpg' }, specs: { year: 2026, countries: ['Uzbekistan'] } };

test('movie placeholder uses SkeletonLoader in the image, title and metadata containers', () => {
  const { container } = render(<ChanelMovieCardSkeleton layout="row" />);
  expect(container.querySelectorAll('.skeleton-loader')).toHaveLength(3);
  expect(container.querySelector('.movies-item-image-wrapper .skeleton-loader')).not.toBeNull();
  expect(container.querySelector('.movies-item-title .skeleton-loader')).not.toBeNull();
  expect(container.querySelector('.movies-item-meta .skeleton-loader')).not.toBeNull();
  expect(container.querySelector('.movies-item-horizontal')).not.toBeNull();
});

test('poster loading shows all three skeletons and reveals the title and metadata when ready', () => {
  mockLoading = true;
  const { container, rerender } = render(<ChanelContentCard kind="movie" item={movie} />);
  expect(container.querySelectorAll('.skeleton-loader')).toHaveLength(3);
  expect(screen.queryByRole('heading')).toBeNull();
  mockLoading = false;
  rerender(<ChanelContentCard kind="movie" item={movie} />);
  expect(container.querySelectorAll('.skeleton-loader')).toHaveLength(0);
  expect(screen.getByRole('heading', { name: 'Kino' })).toBeTruthy();
  expect(screen.getByText('2026-yil Uzbekistan')).toBeTruthy();
});

test('weekly-top forced placeholders keep the title and metadata skeletons without movie data', () => {
  mockLoading = false;
  const { container } = render(<ChanelContentCard kind="movie" item={{ id: 'loading' }} forceSkeleton />);
  expect(container.querySelectorAll('.skeleton-loader')).toHaveLength(3);
});
