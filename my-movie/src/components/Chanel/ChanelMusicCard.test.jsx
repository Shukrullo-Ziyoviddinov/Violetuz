import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChanelMusicCard, { ChanelMusicCardSkeleton } from './ChanelMusicCard';
let mockLoading;
let mockArtistsLoading;
const mockNavigate = jest.fn();
const mockWishlist = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });
jest.mock('../../context/WishlistContext', () => ({ useWishlist: () => ({ toggleWishlist: mockWishlist, isInWishlist: () => false }) }));
jest.mock('../../context/MusicApiContext', () => ({ useMusicApi: () => ({ getArtistById: () => ({ name: 'Artist' }), artistsLoading: mockArtistsLoading }) }));
jest.mock('../../utils/useImageReady', () => ({ useImageReady: () => ({ showSkeleton: mockLoading, failed: false,
  imgRef: null, onLoad: jest.fn(), onError: jest.fn() }) }));
const item = { id: 1, title: 'Nomi', img: '/image.jpg', artistId: 'artist-1' };
beforeEach(() => { mockLoading = false; mockArtistsLoading = false; jest.clearAllMocks(); });

test.each(['row', 'grid'])('%s placeholders include image, title and artist SkeletonLoaders in the existing overlay', (layout) => {
  const { container } = render(<ChanelMusicCardSkeleton layout={layout} />);
  expect(container.querySelectorAll('.skeleton-loader')).toHaveLength(3);
  expect(container.querySelector('.chanel-music-card-image-wrap .chanel-music-card-image-skeleton')).not.toBeNull();
  expect(container.querySelector('.chanel-music-card-info .chanel-music-card-title.skeleton-loader')).not.toBeNull();
  expect(container.querySelector('.chanel-music-card-info .chanel-music-card-artist.skeleton-loader')).not.toBeNull();
  expect(container.querySelector(`.chanel-music-card--${layout}`)).not.toBeNull();
});

test.each(['music', 'album'])('%s image loading also covers title and artist until ready', (wishlistType) => {
  mockLoading = true;
  const { container, rerender } = render(<ChanelMusicCard item={item} wishlistType={wishlistType} />);
  expect(container.querySelectorAll('.skeleton-loader')).toHaveLength(3);
  expect(screen.queryByRole('heading')).toBeNull();
  mockLoading = false;
  rerender(<ChanelMusicCard item={item} wishlistType={wishlistType} />);
  expect(container.querySelector('.skeleton-loader')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Nomi' })).toBeTruthy();
  expect(screen.getByText('Artist')).toBeTruthy();
});

test('artist metadata loading preserves the ready title and replaces only the artist line', () => {
  mockArtistsLoading = true;
  const { container, rerender } = render(<ChanelMusicCard item={item} />);
  expect(screen.getByRole('heading', { name: 'Nomi' })).toBeTruthy();
  expect(container.querySelector('.chanel-music-card-artist-skeleton')).not.toBeNull();
  mockArtistsLoading = false;
  rerender(<ChanelMusicCard item={item} />);
  expect(screen.getByText('Artist')).toBeTruthy();
});

test('loaded album cards retain their album route and wishlist entity', () => {
  const { container } = render(<ChanelMusicCard item={item} wishlistType="album" to="/music/album/1" />);
  fireEvent.click(container.querySelector('article'));
  expect(mockNavigate).toHaveBeenCalledWith('/music/album/1');
  fireEvent.click(screen.getByRole('button'));
  expect(mockWishlist).toHaveBeenCalledWith(1, 'album');
  expect(mockNavigate).toHaveBeenCalledTimes(1);
});
