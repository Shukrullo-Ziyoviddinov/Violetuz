import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useMusicApi } from '../../context/MusicApiContext';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import ChanelContentCard, { ChanelMovieCardSkeleton } from './ChanelContentCard';
import ChanelMusicCard, { ChanelMusicCardSkeleton } from './ChanelMusicCard';
import ChanelClipCard, { ChanelClipCardSkeleton } from './ChanelClipCard';
import ChanelTrailerCard, { ChanelTrailerCardSkeleton } from './ChanelTrailerCard';
import { channelMovieTrailers } from './channelMovieTrailers';
import ChanelPardaCard from './ChanelPardaCard';
import ChanelShortCard, { ChanelShortCardSkeleton } from './ChanelShortCard';
import ChanelWeeklyTopMovies from './ChanelWeeklyTopMovies';
import ChanelWeeklyTopMusic from './ChanelWeeklyTopMusic';
import { useTrillerList } from '../../hooks/useTrillerList';
import { sortByUploadedAtDesc } from './sortByUploadedAt';
import { movieMatchesGenre } from './channelGenre';
import './ChanelContent.css';
import useChannelFilterCatalogs from './useChannelFilterCatalogs';
import { filterChannelItems } from './channelFilterLogic';

const sameChannel = (item, channelId) => String(item?.channelId || '') === String(channelId || '');

const ChannelSection = ({ title, cards }) => {
  if (!cards.length) return null;
  return (
    <div className="chanel-content-row">
      <h2 className="chanel-content-title">{title}</h2>
      <HorizontalScroll>{cards}</HorizontalScroll>
    </div>
  );
};

const ChanelContent = ({ channelId, filter = 'all', genreId = null, trendIds = null, musicForYouIds = null, advancedFilter = null }) => {
  const { t } = useTranslation();
  const { allMovies, allShortsVideos, allGenres, moviesLoading, shortsLoading } = useMoviesApi();
  const { allMusic, allClips, allAlbums, musicLoading, albumsLoading, clipsLoading, concertsLoading } = useMusicApi();
  const { data: allTrillers = [] } = useTrillerList();
  const catalogs = useChannelFilterCatalogs(channelId);

  const items = useMemo(() => {
    if (advancedFilter) {
      return sortByUploadedAtDesc(filterChannelItems(catalogs, advancedFilter)).map((item) => ({
        kind: advancedFilter.type, key: `${advancedFilter.type}-${item.id}`, item,
      }));
    }
    const toMovie = (movie) => ({ kind: 'movie', key: `movie-${movie.id}`, item: movie });
    const toShort = (short) => ({ kind: 'short', key: `short-${short.id}`, item: short });
    const toKind = (kind) => (item) => ({ kind, key: `${kind}-${item.id}`, item });
    const movies = (allMovies || []).filter((movie) => sameChannel(movie, channelId));
    const movieTrailers = channelMovieTrailers(movies, channelId);
    const music = (allMusic || []).filter((track) => sameChannel(track, channelId));
    const clips = (allClips || []).filter((clip) => sameChannel(clip, channelId));
    const albums = (allAlbums || []).filter((album) => sameChannel(album, channelId));
    const shorts = (allShortsVideos || []).filter((short) => sameChannel(short, channelId));
    const trailers = (allTrillers || []).filter((video) => sameChannel(video, channelId));
    const genre = genreId ? (allGenres || []).find((item) => item.id === genreId) : null;

    if (Array.isArray(musicForYouIds) && musicForYouIds.length) {
      const byId = new Map(music.map((track) => [String(track.id), track]));
      return musicForYouIds.map((id) => byId.get(String(id))).filter(Boolean).map(toKind('music'));
    }

    if (Array.isArray(trendIds) && trendIds.length) {
      const byId = new Map(movies.map((movie) => [String(movie.id), movie]));
      return trendIds.map((id) => byId.get(String(id))).filter(Boolean).map(toMovie);
    }

    if (genre) {
      return sortByUploadedAtDesc(movies.filter((movie) => movieMatchesGenre(movie, genre))).map(toMovie);
    }

    if (filter === 'movies') return sortByUploadedAtDesc(movies).map(toMovie);
    if (filter === 'trailers') return movieTrailers.map((item) => ({ kind: 'trailer', key: `trailer-${item.key}`, item }));
    if (filter === 'music') return sortByUploadedAtDesc(music).map(toKind('music'));
    if (filter === 'klip') return sortByUploadedAtDesc(clips).map(toKind('klip'));
    if (filter === 'album') return sortByUploadedAtDesc(albums).map(toKind('album'));
    if (filter === 'konsert') return sortByUploadedAtDesc(catalogs.konsert).map(toKind('konsert'));
    if (filter === 'videos') return sortByUploadedAtDesc(trailers).map(toKind('parda'));
    if (filter === 'shorts') return sortByUploadedAtDesc(shorts).map(toShort);
    if (filter === 'playlists') return [];
    if (filter === 'posts') return [];
    return [
      ...movies.map(toMovie),
      ...movieTrailers.map((item) => ({ kind: 'trailer', key: `trailer-${item.key}`, item })),
      ...sortByUploadedAtDesc(music).map(toKind('music')),
      ...sortByUploadedAtDesc(albums).map(toKind('album')),
      ...sortByUploadedAtDesc(catalogs.konsert).map(toKind('konsert')),
      ...sortByUploadedAtDesc(trailers).map(toKind('parda')),
      ...sortByUploadedAtDesc(clips).map(toKind('klip')),
      ...shorts.map(toShort),
    ];
  }, [allMovies, allMusic, allClips, allAlbums, allTrillers, allShortsVideos, allGenres, channelId, filter, genreId, trendIds, musicForYouIds, advancedFilter, catalogs]);

  const movieScope = advancedFilter ? advancedFilter.type === 'movie'
    : !(Array.isArray(musicForYouIds) && musicForYouIds.length)
      && (filter === 'all' || filter === 'movies' || Boolean(genreId) || (Array.isArray(trendIds) && trendIds.length > 0));
  const moviesPending = Boolean(moviesLoading && movieScope && !items.some((entry) => entry.kind === 'movie'));
  const trailerScope = !advancedFilter && !genreId && !(Array.isArray(trendIds) && trendIds.length)
    && !(Array.isArray(musicForYouIds) && musicForYouIds.length) && (filter === 'all' || filter === 'trailers');
  const trailersPending = Boolean(moviesLoading && trailerScope && !items.some((entry) => entry.kind === 'trailer'));
  const mediaScope = !genreId && !(Array.isArray(trendIds) && trendIds.length)
    && !(Array.isArray(musicForYouIds) && musicForYouIds.length);
  const clipsPending = Boolean(clipsLoading && !items.some((entry) => entry.kind === 'klip')
    && (advancedFilter ? advancedFilter.type === 'klip' : mediaScope && (filter === 'all' || filter === 'klip')));
  const concertsPending = Boolean(concertsLoading && !items.some((entry) => entry.kind === 'konsert')
    && (advancedFilter ? advancedFilter.type === 'konsert' : mediaScope && (filter === 'all' || filter === 'konsert')));
  const musicPending = Boolean(musicLoading && !items.some((entry) => entry.kind === 'music')
    && (advancedFilter ? advancedFilter.type === 'music'
      : (mediaScope && (filter === 'all' || filter === 'music')) || (Array.isArray(musicForYouIds) && musicForYouIds.length > 0)));
  const albumsPending = Boolean(albumsLoading && !items.some((entry) => entry.kind === 'album')
    && (advancedFilter ? advancedFilter.type === 'album' : mediaScope && (filter === 'all' || filter === 'album')));
  const shortsPending = Boolean(shortsLoading && !advancedFilter && mediaScope
    && (filter === 'all' || filter === 'shorts') && !items.some((entry) => entry.kind === 'short'));
  if (shortsPending && filter === 'shorts') {
    return <div className="chanel-content-shorts" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => <ChanelShortCardSkeleton key={index} />)}
    </div>;
  }
  if ((musicPending || albumsPending) && (advancedFilter || filter !== 'all' || (Array.isArray(musicForYouIds) && musicForYouIds.length))) {
    return <div className="chanel-music-grid" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => <ChanelMusicCardSkeleton key={index} layout="grid" />)}
    </div>;
  }
  if ((clipsPending || concertsPending) && (advancedFilter || filter !== 'all')) {
    return <div className="chanel-clip-grid" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => <ChanelClipCardSkeleton key={index} layout="grid" />)}
    </div>;
  }
  if (trailersPending && filter === 'trailers') {
    return <div className="chanel-clip-grid" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => <ChanelTrailerCardSkeleton key={index} layout="grid" />)}
    </div>;
  }
  if (moviesPending && (advancedFilter || filter !== 'all' || genreId || (Array.isArray(trendIds) && trendIds.length))) {
    return <div className="chanel-content-grid" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => <ChanelMovieCardSkeleton key={index} />)}
    </div>;
  }
  if (!items.length && !moviesPending && !trailersPending && !clipsPending && !concertsPending && !musicPending && !albumsPending && !shortsPending) return advancedFilter ? <p className="channel-page-message">{t('channel.noFilterResults', 'Mos ma’lumot topilmadi')}</p> : null;

  const layout = filter === 'all' ? 'row' : 'grid';
  const renderCard = (entry, cardLayout) => {
    if (entry.kind === 'trailer') {
      return <ChanelTrailerCard key={entry.key} item={entry.item} layout={cardLayout} />;
    }
    if (entry.kind === 'short') {
      return <ChanelShortCard key={entry.key} item={entry.item} layout={cardLayout} />;
    }
    if (entry.kind === 'music' || entry.kind === 'album') {
      return (
        <ChanelMusicCard
          key={entry.key}
          item={entry.item}
          layout={cardLayout === 'row' ? 'row' : 'grid'}
          wishlistType={entry.kind === 'album' ? 'album' : 'music'}
          to={entry.kind === 'album' ? `/music/album/${entry.item.id}` : undefined}
        />
      );
    }
    if (entry.kind === 'klip' || entry.kind === 'konsert') {
      return <ChanelClipCard key={entry.key} item={entry.item} contentType={entry.kind} layout={cardLayout === 'row' ? 'row' : 'grid'} />;
    }
    if (entry.kind === 'parda') {
      return <ChanelPardaCard key={entry.key} item={entry.item} layout={cardLayout === 'row' ? 'row' : 'grid'} />;
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

  if (advancedFilter) {
    const gridClass = advancedFilter.type === 'music' || advancedFilter.type === 'album'
      ? 'chanel-music-grid' : advancedFilter.type === 'movie' ? 'chanel-content-grid' : 'chanel-clip-grid';
    return <div className={gridClass}>{items.map((entry) => renderCard(entry, 'grid'))}</div>;
  }

  if (Array.isArray(musicForYouIds) && musicForYouIds.length) {
    return <div className="chanel-music-grid">{items.map((entry) => renderCard(entry, 'grid'))}</div>;
  }

  if (genreId || (Array.isArray(trendIds) && trendIds.length)) {
    return <div className="chanel-content-grid">{items.map((entry) => renderCard(entry, 'grid'))}</div>;
  }

  if (filter === 'all') {
    const movieCards = moviesPending
      ? Array.from({ length: 6 }, (_, index) => <ChanelMovieCardSkeleton key={`movie-loading-${index}`} layout="row" />)
      : items.filter((entry) => entry.kind === 'movie').map((entry) => renderCard(entry, 'row'));
    const trailerCards = trailersPending
      ? Array.from({ length: 6 }, (_, index) => <ChanelTrailerCardSkeleton key={`trailer-loading-${index}`} />)
      : items.filter((entry) => entry.kind === 'trailer').map((entry) => renderCard(entry, 'row'));
    const musicCards = musicPending
      ? Array.from({ length: 6 }, (_, index) => <ChanelMusicCardSkeleton key={`music-loading-${index}`} />)
      : items.filter((entry) => entry.kind === 'music').map((entry) => renderCard(entry, 'row'));
    const albumCards = albumsPending
      ? Array.from({ length: 6 }, (_, index) => <ChanelMusicCardSkeleton key={`album-loading-${index}`} />)
      : items.filter((entry) => entry.kind === 'album').map((entry) => renderCard(entry, 'row'));
    const pardaCards = items.filter((entry) => entry.kind === 'parda').map((entry) => renderCard(entry, 'row'));
    const clipCards = clipsPending
      ? Array.from({ length: 6 }, (_, index) => <ChanelClipCardSkeleton key={`clip-loading-${index}`} />)
      : items.filter((entry) => entry.kind === 'klip').map((entry) => renderCard(entry, 'row'));
    const shortCards = shortsPending
      ? Array.from({ length: 6 }, (_, index) => <ChanelShortCardSkeleton key={`short-loading-${index}`} layout="row" />)
      : items.filter((entry) => entry.kind === 'short').map((entry) => renderCard(entry, 'row'));
    const concertCards = concertsPending
      ? Array.from({ length: 6 }, (_, index) => <ChanelClipCardSkeleton key={`concert-loading-${index}`} />)
      : items.filter((entry) => entry.kind === 'konsert').map((entry) => renderCard(entry, 'row'));
    return (
      <>
        <ChannelSection title={t('channel.movies', 'Kinolar')} cards={movieCards} />
        <ChannelSection title={t('channel.trailers', 'Treylerlar')} cards={trailerCards} />
        <ChannelSection title={t('channel.clips', 'Kliplar')} cards={clipCards} />
        <ChannelSection title={t('channel.music', 'Musiqalar')} cards={musicCards} />
        <ChanelWeeklyTopMusic channelId={channelId} />
        <ChanelWeeklyTopMovies channelId={channelId} />
        <ChannelSection title={t('channel.albums', 'Albomlar')} cards={albumCards} />
        <ChannelSection title={t('channel.concerts', 'Konsertlar')} cards={concertCards} />
        <ChannelSection title={t('channel.videos', 'Videolar')} cards={pardaCards} />
        <ChannelSection title={t('channel.shorts', 'Shortslar')} cards={shortCards} />
      </>
    );
  }

  if (filter === 'music' || filter === 'album') {
    const grid = <div className="chanel-music-grid">{items.map((entry) => renderCard(entry, 'grid'))}</div>;
    if (filter === 'album') return grid;
    return (
      <>
        <ChanelWeeklyTopMusic channelId={channelId} />
        {grid}
      </>
    );
  }

  if (filter === 'klip' || filter === 'konsert' || filter === 'videos' || filter === 'trailers') {
    return <div className="chanel-clip-grid">{items.map((entry) => renderCard(entry, 'grid'))}</div>;
  }

  const cards = items.map((entry) => renderCard(entry, layout));

  if (filter === 'shorts') {
    return <div className="chanel-content-shorts">{cards}</div>;
  }

  if (filter === 'movies') {
    return (
      <>
        <ChanelWeeklyTopMovies channelId={channelId} />
        <div className="chanel-content-grid">{cards}</div>
      </>
    );
  }

  return <div className="chanel-content-grid">{cards}</div>;
};

export default ChanelContent;
