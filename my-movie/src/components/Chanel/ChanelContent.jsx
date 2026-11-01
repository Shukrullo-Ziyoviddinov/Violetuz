import React, { useMemo } from 'react';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useMusicApi } from '../../context/MusicApiContext';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import ChanelContentCard from './ChanelContentCard';
import './ChanelContent.css';

const sameChannel = (item, channelId) => String(item?.channelId || '') === String(channelId || '');

const ChanelContent = ({ channelId, filter = 'all' }) => {
  const { allMovies } = useMoviesApi();
  const { allMusic } = useMusicApi();

  const items = useMemo(() => {
    const movies = (allMovies || [])
      .filter((movie) => sameChannel(movie, channelId))
      .map((movie) => ({ kind: 'movie', key: `movie-${movie.id}`, item: movie }));
    const music = (allMusic || [])
      .filter((track) => sameChannel(track, channelId))
      .map((track) => ({ kind: 'music', key: `music-${track.id}`, item: track }));

    if (filter === 'movies') return movies;
    if (filter === 'videos') return [];
    if (filter === 'shorts') return [];
    if (filter === 'playlists') return [];
    if (filter === 'posts') return [];
    return [...movies, ...music];
  }, [allMovies, allMusic, channelId, filter]);

  if (!items.length) return null;

  const layout = filter === 'all' ? 'row' : 'grid';
  const cards = items.map((entry) => (
    <ChanelContentCard
      key={entry.key}
      kind={entry.kind}
      item={entry.item}
      layout={layout}
    />
  ));

  if (layout === 'row') {
    return (
      <div className="chanel-content-row">
        <HorizontalScroll>{cards}</HorizontalScroll>
      </div>
    );
  }

  return <div className="chanel-content-grid">{cards}</div>;
};

export default ChanelContent;
