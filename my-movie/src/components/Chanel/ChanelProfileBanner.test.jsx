import React from 'react';
import { render } from '@testing-library/react';
import ChanelProfileBanner, { ChanelProfileBannerSkeleton } from './ChanelProfileBanner';
let mockLoading;
let mockMoviesLoading;
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../../context/MoviesApiContext', () => ({ useMoviesApi: () => ({
  allMovies: mockMoviesLoading ? [] : [{ id: 1, titleImg: { uz: '/title.png' } }], moviesLoading: mockMoviesLoading,
}) }));
jest.mock('../../context/ContentLanguageContext', () => ({ useContentLanguage: () => ({ contentLang: 'uz' }) }));
jest.mock('../../utils/useImageReady', () => ({ useImageReady: (src) => ({ showSkeleton: Boolean(src && mockLoading),
  failed: false, imgRef: null, onLoad: jest.fn(), onError: jest.fn() }) }));
beforeEach(() => {
  mockLoading = true;
  mockMoviesLoading = false;
  global.ResizeObserver = class { observe() {} disconnect() {} };
});
const banner = { banners: [{ id: 1, img: '/banner.jpg', movieId: 1 }] };

test('initial channel placeholder reserves banner and title shapes with SkeletonLoader', () => {
  const { container } = render(<ChanelProfileBannerSkeleton />);
  expect(container.querySelector('.channel-profile-banner-slide .skeleton-loader--banner-image')).not.toBeNull();
  expect(container.querySelector('.channel-profile-banner-title.skeleton-loader')).not.toBeNull();
});

test('banner and title image loaders disappear when images are ready', () => {
  const { container, rerender } = render(<ChanelProfileBanner profileBanner={banner} />);
  expect(container.querySelectorAll('.skeleton-loader')).toHaveLength(2);
  expect(container.querySelector('.channel-profile-banner-photo').classList.contains('is-loading')).toBe(true);
  mockLoading = false;
  rerender(<ChanelProfileBanner profileBanner={banner} />);
  expect(container.querySelectorAll('.skeleton-loader')).toHaveLength(0);
  expect(container.querySelector('.channel-profile-banner-title').classList.contains('is-loading')).toBe(false);
});

test('movie metadata keeps the title skeleton visible until the title image is available', () => {
  mockMoviesLoading = true;
  mockLoading = false;
  const { container, rerender } = render(<ChanelProfileBanner profileBanner={banner} />);
  expect(container.querySelector('.channel-profile-banner-title-skeleton')).not.toBeNull();
  mockMoviesLoading = false;
  rerender(<ChanelProfileBanner profileBanner={banner} />);
  expect(container.querySelector('.channel-profile-banner-title-skeleton')).toBeNull();
  expect(container.querySelector('img.channel-profile-banner-title')).not.toBeNull();
});
