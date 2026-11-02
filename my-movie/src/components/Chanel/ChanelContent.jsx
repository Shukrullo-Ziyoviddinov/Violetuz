import React, { useMemo } from 'react';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useMusicApi } from '../../context/MusicApiContext';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import ChanelContentCard from './ChanelContentCard';
import ChanelShortCard from './ChanelShortCard';
import { sortByUploadedAtDesc } from './sortByUploadedAt';
import { movieMatchesGenre } from './channelGenre';
import './ChanelContent.css';

const sameChannel = (item, channelId) => String(item?.channelId || '') === String(channelId || '');

const ChanelContent = ({ channelId, filter = 'all', genreId = null, trendIds = null }) => {
  const { allMovies, allShortsVideos, allGenres } = useMoviesApi();
  const { allMusic } = useMusicApi();

  const items = useMemo(() => {
    const toMovie = (movie) => ({ kind: 'movie', key: `movie-${movie.id}`, item: movie });
    const toShort = (short) => ({ kind: 'short', key: `short-${short.id}`, item: short });
    const movies = (allMovies || []).filter((movie) => sameChannel(movie, channelId));
    const music = (allMusic || [])
      .filter((track) => sameChannel(track, channelId))
      .map((track) => ({ kind: 'music', key: `music-${track.id}`, item: track }));
    const shorts = (allShortsVideos || []).filter((short) => sameChannel(short, channelId));
    const genre = genreId ? (allGenres || []).find((item) => item.id === genreId) : null;

    if (Array.isArray(trendIds) && trendIds.length) {
      const byId = new Map(movies.map((movie) => [String(movie.id), movie]));
      return trendIds.map((id) => byId.get(String(id))).filter(Boolean).map(toMovie);
    }

    if (genre) {
      return sortByUploadedAtDesc(movies.filter((movie) => movieMatchesGenre(movie, genre))).map(toMovie);
    }

    if (filter === 'movies') return sortByUploadedAtDesc(movies).map(toMovie);
    if (filter === 'videos') return [];
    if (filter === 'shorts') return sortByUploadedAtDesc(shorts).map(toShort);
    if (filter === 'playlists') return [];
    if (filter === 'posts') return [];
    return [...movies.map(toMovie), ...music, ...shorts.map(toShort)];
  }, [allMovies, allMusic, allShortsVideos, allGenres, channelId, filter, genreId, trendIds]);

  if (!items.length) return null;

  const layout = filter === 'all' ? 'row' : 'grid';
  const renderCard = (entry, cardLayout) => (
    entry.kind === 'short' ? (
      <ChanelShortCard key={entry.key} item={entry.item} layout={cardLayout} />
    ) : (
      <ChanelContentCard
        key={entry.key}
        kind={entry.kind}
        item={entry.item}
        layout={cardLayout}
      />
    )
  );

  if (genreId || (Array.isArray(trendIds) && trendIds.length)) {
    return <div className="chanel-content-grid">{items.map((entry) => renderCard(entry, 'grid'))}</div>;
  }

  if (filter === 'all') {
    const mainCards = items.filter((entry) => entry.kind !== 'short').map((entry) => renderCard(entry, 'row'));
    const shortCards = items.filter((entry) => entry.kind === 'short').map((entry) => renderCard(entry, 'row'));
    return (
      <>
        {mainCards.length ? (
          <div className="chanel-content-row">
            <HorizontalScroll>{mainCards}</HorizontalScroll>
          </div>
        ) : null}
        {shortCards.length ? (
          <div className="chanel-content-row">
            <HorizontalScroll>{shortCards}</HorizontalScroll>
          </div>
        ) : null}
      </>
    );
  }

  const cards = items.map((entry) => renderCard(entry, layout));

  if (filter === 'shorts') {
    return <div className="chanel-content-shorts">{cards}</div>;
  }

  return <div className="chanel-content-grid">{cards}</div>;
};

export default ChanelContent;
