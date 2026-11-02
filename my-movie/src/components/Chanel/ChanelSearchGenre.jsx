import React, { useMemo } from 'react';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useImageReady } from '../../utils/useImageReady';
import { normalizeImagePath } from '../../utils/utils';
import { channelMovieGenres } from './channelGenre';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import './ChanelSearchGenre.css';

const sameChannel = (item, channelId) => String(item?.channelId || '') === String(channelId || '');

const genreTitle = (genre, lang) => {
  const title = genre?.title;
  if (title && typeof title === 'object') return title[lang] || title.uz || title.ru || '';
  return String(title || '').trim();
};

const GenreCard = ({ genre, title, active, onSelect }) => {
  const imgSrc = normalizeImagePath(genre.img || '');
  const { showSkeleton, imgRef, onLoad, onError, failed } = useImageReady(imgSrc);

  return (
    <button
      type="button"
      className={`chanel-search-genre-card${active ? ' is-active' : ''}${showSkeleton ? ' is-loading' : ''}`}
      aria-pressed={active}
      onClick={() => onSelect(genre)}
    >
      {!failed && imgSrc ? (
        <img
          ref={imgRef}
          src={imgSrc}
          alt=""
          className={showSkeleton ? 'is-loading' : undefined}
          onLoad={onLoad}
          onError={onError}
        />
      ) : null}
      <span>{title}</span>
    </button>
  );
};

const ChanelSearchGenre = ({ channelId, selectedId, onSelect }) => {
  const { contentLang } = useContentLanguage();
  const { allGenres, allMovies, genresLoading } = useMoviesApi();

  const genres = useMemo(() => {
    const movies = (allMovies || []).filter((movie) => sameChannel(movie, channelId));
    return channelMovieGenres(allGenres, movies);
  }, [allGenres, allMovies, channelId]);

  if (!genresLoading && genres.length === 0) return null;

  return (
    <div className="chanel-search-genre">
      <p className="chanel-search-genre-title">Janr</p>
      <HorizontalScroll scrollAmount={182}>
        {genres.map((genre) => (
          <GenreCard
            key={genre.id}
            genre={genre}
            title={genreTitle(genre, contentLang)}
            active={selectedId === genre.id}
            onSelect={onSelect}
          />
        ))}
      </HorizontalScroll>
    </div>
  );
};

export default ChanelSearchGenre;
