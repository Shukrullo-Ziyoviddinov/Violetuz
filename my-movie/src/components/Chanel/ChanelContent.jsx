import React, { useMemo } from 'react';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useMusicApi } from '../../context/MusicApiContext';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import ChanelContentCard from './ChanelContentCard';
import ChanelMusicCard from './ChanelMusicCard';
import ChanelClipCard from './ChanelClipCard';
import ChanelShortCard from './ChanelShortCard';
import { sortByUploadedAtDesc } from './sortByUploadedAt';
import { movieMatchesGenre } from './channelGenre';
import './ChanelContent.css';

const sameChannel = (item, channelId) => String(item?.channelId || '') === String(channelId || '');

const ChanelContent = ({ channelId, filter = 'all', genreId = null, trendIds = null }) => {
  const { allMovies, allShortsVideos, allGenres } = useMoviesApi();
  const { allMusic, allClips, allAlbums } = useMusicApi();

  const items = useMemo(() => {
    const toMovie = (movie) => ({ kind: 'movie', key: `movie-${movie.id}`, item: movie });
    const toShort = (short) => ({ kind: 'short', key: `short-${short.id}`, item: short });
    const toKind = (kind) => (item) => ({ kind, key: `${kind}-${item.id}`, item });
    const movies = (allMovies || []).filter((movie) => sameChannel(movie, channelId));
    const music = (allMusic || []).filter((track) => sameChannel(track, channelId));
    const clips = (allClips || []).filter((clip) => sameChannel(clip, channelId));
    const albums = (allAlbums || []).filter((album) => sameChannel(album, channelId));
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
    if (filter === 'music') return sortByUploadedAtDesc(music).map(toKind('music'));
    if (filter === 'klip') return sortByUploadedAtDesc(clips).map(toKind('klip'));
    if (filter === 'album') return sortByUploadedAtDesc(albums).map(toKind('album'));
    if (filter === 'videos') return [];
    if (filter === 'shorts') return sortByUploadedAtDesc(shorts).map(toShort);
    if (filter === 'playlists') return [];
    if (filter === 'posts') return [];
    return [
      ...movies.map(toMovie),
      ...sortByUploadedAtDesc(music).map(toKind('music')),
      ...sortByUploadedAtDesc(clips).map(toKind('klip')),
      ...shorts.map(toShort),
    ];
  }, [allMovies, allMusic, allClips, allAlbums, allShortsVideos, allGenres, channelId, filter, genreId, trendIds]);

  if (!items.length) return null;

  const layout = filter === 'all' ? 'row' : 'grid';
  const renderCard = (entry, cardLayout) => {
    if (entry.kind === 'short') {
      return <ChanelShortCard key={entry.key} item={entry.item} layout={cardLayout} />;
    }
    if (entry.kind === 'music') {
      return <ChanelMusicCard key={entry.key} item={entry.item} layout={cardLayout === 'row' ? 'row' : 'grid'} />;
    }
    if (entry.kind === 'klip') {
      return <ChanelClipCard key={entry.key} item={entry.item} layout={cardLayout === 'row' ? 'row' : 'grid'} />;
    }
    return (
      <ChanelContentCard
        key={entry.key}
        kind={entry.kind}
        item={entry.item}
        layout={cardLayout}
      />
    );
  };

  if (genreId || (Array.isArray(trendIds) && trendIds.length)) {
    return <div className="chanel-content-grid">{items.map((entry) => renderCard(entry, 'grid'))}</div>;
  }

  if (filter === 'all') {
    const movieCards = items.filter((entry) => entry.kind === 'movie').map((entry) => renderCard(entry, 'row'));
    const musicCards = items.filter((entry) => entry.kind === 'music').map((entry) => renderCard(entry, 'row'));
    const clipCards = items.filter((entry) => entry.kind === 'klip').map((entry) => renderCard(entry, 'row'));
    const shortCards = items.filter((entry) => entry.kind === 'short').map((entry) => renderCard(entry, 'row'));
    return (
      <>
        {movieCards.length ? (
          <div className="chanel-content-row">
            <HorizontalScroll>{movieCards}</HorizontalScroll>
          </div>
        ) : null}
        {clipCards.length ? (
          <div className="chanel-content-row">
            <HorizontalScroll>{clipCards}</HorizontalScroll>
          </div>
        ) : null}
        {musicCards.length ? (
          <div className="chanel-content-row">
            <HorizontalScroll>{musicCards}</HorizontalScroll>
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

  if (filter === 'music') {
    return <div className="chanel-music-grid">{items.map((entry) => renderCard(entry, 'grid'))}</div>;
  }

  if (filter === 'klip') {
    return <div className="chanel-clip-grid">{items.map((entry) => renderCard(entry, 'grid'))}</div>;
  }

  const cards = items.map((entry) => renderCard(entry, layout));

  if (filter === 'shorts') {
    return <div className="chanel-content-shorts">{cards}</div>;
  }

  return <div className="chanel-content-grid">{cards}</div>;
};

export default ChanelContent;
