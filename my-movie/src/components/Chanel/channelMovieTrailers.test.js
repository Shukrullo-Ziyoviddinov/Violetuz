import { channelMovieTrailers } from './channelMovieTrailers';

test('shows only channel movie trailers in newest movie upload order', () => {
  const movies = [
    { id: 1, channelId: 'a', createdAt: '2025-01-01', trailersVideo: [{ id: 1, trailers: { uz: '/old.mp4' } }] },
    { id: 2, channelId: 'b', createdAt: '2026-11-01', trailersVideo: [{ id: 1, trailers: '/other.mp4' }] },
    { id: 3, channelId: 'a', uploadedAt: '2026-01-01', trailersVideo: [{ id: 2, trailers: '/new.mp4' }, { id: 1, trailers: '/second.mp4' }] },
  ];
  const snapshot = JSON.stringify(movies);
  expect(channelMovieTrailers(movies, 'a').map((trailer) => trailer.key)).toEqual(['3-2', '3-1', '1-1']);
  expect(JSON.stringify(movies)).toEqual(snapshot);
});

test('skips missing videos, duplicates and missing trailer ids; does not merge equal ids across movies', () => {
  const movies = [
    { id: 1, channelId: 12, trailersVideo: [null, { id: 1, trailers: {} }, { trailers: '/no-id.mp4' }, { id: 2, trailers: '/valid.mp4' }, { id: 2, trailers: '/duplicate.mp4' }] },
    { id: 2, channelId: '12', trailersVideo: [{ id: 2, trailers: { ru: '/other.mp4' } }] },
    { id: 3, channelId: '12', trailersVideo: null },
  ];
  expect(channelMovieTrailers(movies, '12').map((trailer) => trailer.key)).toEqual(['1-2', '2-2']);
  expect(channelMovieTrailers(movies, null)).toEqual([]);
});
