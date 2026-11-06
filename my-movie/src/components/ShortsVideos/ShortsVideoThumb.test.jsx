import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import ShortsVideoThumb from './ShortsVideoThumb';

const state = (video, value) => Object.defineProperty(video, 'readyState', { configurable: true, value });

test('the shield displays SkeletonLoader until the preview has an actual video frame', () => {
  const onClick = jest.fn();
  const { container } = render(<ShortsVideoThumb videoSrc="/short.mp4" onClick={onClick} />);
  const shield = container.querySelector('.shorts-video-thumb-shield');
  const video = container.querySelector('video');
  expect(shield.querySelector('.skeleton-loader--shorts-thumb')).not.toBeNull();
  state(video, HTMLMediaElement.HAVE_METADATA);
  fireEvent.loadedMetadata(video);
  expect(shield.querySelector('.skeleton-loader')).not.toBeNull();
  state(video, HTMLMediaElement.HAVE_CURRENT_DATA);
  fireEvent.loadedData(video);
  expect(shield.querySelector('.skeleton-loader')).toBeNull();
  fireEvent.click(shield);
  expect(onClick).toHaveBeenCalledTimes(1);
});

test('pending API data can display the same shield loader without a video source', () => {
  const { container } = render(<ShortsVideoThumb loading />);
  expect(container.querySelector('.shorts-video-thumb-shield .skeleton-loader')).not.toBeNull();
  expect(container.querySelector('video')).toBeNull();
});

test('a new preview source restarts the loader and video errors do not leave an endless skeleton', () => {
  const { container, rerender } = render(<ShortsVideoThumb videoSrc="/first.mp4" />);
  const video = container.querySelector('video');
  state(video, HTMLMediaElement.HAVE_CURRENT_DATA);
  fireEvent.loadedData(video);
  expect(container.querySelector('.skeleton-loader')).toBeNull();
  rerender(<ShortsVideoThumb videoSrc="/second.mp4" />);
  expect(container.querySelector('.skeleton-loader')).not.toBeNull();
  fireEvent.error(container.querySelector('video'));
  expect(container.querySelector('.skeleton-loader')).toBeNull();
  expect(container.querySelector('video')).toBeNull();
});

test('still-frame previews keep the loader at metadata and reveal only a decoded frame', () => {
  const pause = jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  try {
    const { container } = render(<ShortsVideoThumb videoSrc="/still.mp4" still />);
    const video = container.querySelector('video');
    Object.defineProperty(video, 'duration', { configurable: true, value: 0.3 });
    state(video, HTMLMediaElement.HAVE_METADATA);
    fireEvent.loadedMetadata(video);
    expect(container.querySelector('.skeleton-loader')).not.toBeNull();
    state(video, HTMLMediaElement.HAVE_CURRENT_DATA);
    fireEvent.loadedData(video);
    expect(container.querySelector('.skeleton-loader')).toBeNull();
  } finally { pause.mockRestore(); }
});
