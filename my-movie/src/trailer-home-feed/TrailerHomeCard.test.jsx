import React from 'react';
import { render, screen } from '@testing-library/react';
import TrailerHomeCard, { TrailerHomeCardSkeleton } from './TrailerHomeCard';
let mockLoading = true;
jest.mock('react-router-dom', () => ({ Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a> }), { virtual: true });
jest.mock('../context/ContentLanguageContext', () => ({ useContentLanguage: () => ({ contentLang: 'uz' }) }));
jest.mock('../utils/useImageReady', () => ({ useImageReady: () => ({ showSkeleton: mockLoading, failed: false, imgRef: null, onLoad: jest.fn(), onError: jest.fn() }) }));
jest.mock('../components/ViewCount/ViewCount', () => () => <div className="view-count-text">42</div>);

test('data placeholders use SkeletonLoader in image, title and view-count containers without navigation', () => {
  const { container } = render(<TrailerHomeCardSkeleton />);
  expect(container.querySelectorAll('.skeleton-loader')).toHaveLength(3);
  expect(container.querySelector('.trailer-home-card-image-wrap .skeleton-loader--triller-card-image')).not.toBeNull();
  expect(container.querySelector('.trailer-home-card-title .skeleton-loader')).not.toBeNull();
  expect(container.querySelector('.trailer-home-card-meta-row .view-count-text .skeleton-loader')).not.toBeNull();
  expect(container.querySelector('a')).toBeNull();
});

test('image loading holds title and metadata skeletons until the card is ready', () => {
  mockLoading = true;
  const item = { movieId: 12, id: 3, title: { uz: 'Treyler' }, trillerimg: '/image.jpg' };
  const { container, rerender } = render(<TrailerHomeCard item={item} />);
  expect(container.querySelectorAll('.skeleton-loader')).toHaveLength(3);
  expect(screen.queryByRole('heading')).toBeNull();
  expect(screen.queryByText('42')).toBeNull();
  mockLoading = false;
  rerender(<TrailerHomeCard item={item} />);
  expect(container.querySelectorAll('.skeleton-loader')).toHaveLength(0);
  expect(screen.getByRole('heading', { name: 'Treyler' })).toBeTruthy();
  expect(screen.getByText('42')).toBeTruthy();
  expect(container.querySelector('a').getAttribute('href')).toBe('/movie/12/trailer?trailerId=3');
});
