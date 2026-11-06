import React from 'react';
import { render, screen } from '@testing-library/react';
import ChanelClipCard, { ChanelClipCardSkeleton } from './ChanelClipCard';
let mockLoading;
let mockArtistsLoading;
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../../context/WishlistContext', () => ({ useWishlist: () => ({ toggleWishlist: jest.fn(), isInWishlist: () => false }) }));
jest.mock('../../context/MusicApiContext', () => ({ useMusicApi: () => ({ getArtistById: () => ({ name: 'Artist' }), artistsLoading: mockArtistsLoading }) }));
jest.mock('../../utils/useImageReady', () => ({ useImageReady: () => ({ showSkeleton: mockLoading, failed: false,
  imgRef: null, onLoad: jest.fn(), onError: jest.fn() }) }));
const item = { id: 1, title: 'Klip', img: '/clip.jpg', artistId: 'artist-1' };
beforeEach(() => { mockLoading = false; mockArtistsLoading = false; });

test.each(['row', 'grid'])('%s placeholders include image, title and artist SkeletonLoaders', (layout) => {
  const { container } = render(<ChanelClipCardSkeleton layout={layout} />);
  expect(container.querySelectorAll('.skeleton-loader')).toHaveLength(3);
  expect(container.querySelector('.chanel-clip-card-image-wrap .skeleton-loader')).not.toBeNull();
  expect(container.querySelector('.chanel-clip-card-title.skeleton-loader')).not.toBeNull();
  expect(container.querySelector('.chanel-clip-card-artist.skeleton-loader')).not.toBeNull();
  expect(container.querySelector(`.chanel-clip-card--${layout}`)).not.toBeNull();
});

test('image loading holds title and artist skeletons, then reveals both fields', () => {
  mockLoading = true;
  const { container, rerender } = render(<ChanelClipCard item={item} />);
  expect(container.querySelectorAll('.skeleton-loader')).toHaveLength(3);
  expect(screen.queryByRole('heading')).toBeNull();
  mockLoading = false;
  rerender(<ChanelClipCard item={item} />);
  expect(container.querySelector('.skeleton-loader')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Klip' })).toBeTruthy();
  expect(screen.getByText('Artist')).toBeTruthy();
});

test('artist metadata keeps its own skeleton while the loaded image and title remain visible', () => {
  mockArtistsLoading = true;
  const { container, rerender } = render(<ChanelClipCard item={item} />);
  expect(screen.getByRole('heading', { name: 'Klip' })).toBeTruthy();
  expect(container.querySelector('.chanel-clip-card-artist-skeleton')).not.toBeNull();
  expect(screen.queryByText('Artist')).toBeNull();
  mockArtistsLoading = false;
  rerender(<ChanelClipCard item={item} />);
  expect(screen.getByText('Artist')).toBeTruthy();
});
