import React, { useMemo } from 'react';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useMusicApi } from '../../context/MusicApiContext';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import ChanelContentCard from './ChanelContentCard';
import ChanelShortCard from './ChanelShortCard';
import { sortByUploadedAtDesc } from './sortByUploadedAt';
import './ChanelContent.css';

const sameChannel = (item, channelId) => String(item?.channelId || '') === String(channelId || '');

const ChanelContent = ({ channelId, filter = 'all' }) => {
  const { allMovies, allShortsVideos } = useMoviesApi();
  const { allMusic } = useMusicApi();

  const items = useMemo(() => {
    const toMovie = (movie) => ({ kind: 'movie', key: `movie-${movie.id}`, item: movie });
    const toShort = (short) => ({ kind: 'short', key: `short-${short.id}`, item: short });
    const movies = (allMovies || []).filter((movie) => sameChannel(movie, channelId));
    const music = (allMusic || [])
      .filter((track) => sameChannel(track, channelId))
      .map((track) => ({ kind: 'music', key: `music-${track.id}`, item: track }));
    const shorts = (allShortsVideos || []).filter((short) => sameChannel(short, channelId));

    if (filter === 'movies') return sortByUploadedAtDesc(movies).map(toMovie);
    if (filter === 'videos') return [];
    if (filter === 'shorts') return sortByUploadedAtDesc(shorts).map(toShort);
    if (filter === 'playlists') return [];
    if (filter === 'posts') return [];
    return [...movies.map(toMovie), ...music, ...shorts.map(toShort)];
  }, [allMovies, allMusic, allShortsVideos, channelId, filter]);

  if (!items.length) return null;

  const layout = filter === 'all' ? 'row' : 'grid';
  const cards = items.map((entry) => (
    entry.kind === 'short' ? (
      <ChanelShortCard key={entry.key} item={entry.item} layout={layout} />
    ) : (
      <ChanelContentCard
        key={entry.key}
        kind={entry.kind}
        item={entry.item}
        layout={layout}
      />
    )
  ));

  if (filter === 'shorts') {
    return <div className="chanel-content-shorts">{cards}</div>;
  }

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
