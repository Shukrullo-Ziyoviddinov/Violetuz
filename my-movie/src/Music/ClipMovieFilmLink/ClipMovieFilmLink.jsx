import React, { createContext, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { formatMovieRating } from '../../components/Rating/CalculateRating';
import './ClipMovieFilmLink.css';

const ClipMovieFilmLinkContext = createContext(null);

const movieIdsOf = (clip) => {
  const list = clip?.movieId;
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const ids = [];
  for (const raw of list) {
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
};

const localized = (value, lang) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.uz || value.ru || '';
};

const moviePoster = (movie, lang) =>
  localized(movie?.homeImg, lang) || localized(movie?.image, lang) || '';

const movieYear = (movie, lang) => {
  const fromSpecs = movie?.specs?.year;
  if (fromSpecs != null && fromSpecs !== '') return String(fromSpecs);
  const fromDescription = movie?.description?.[lang]?.year || movie?.description?.uz?.year;
  return fromDescription != null && fromDescription !== '' ? String(fromDescription) : '';
};

const movieGenre = (movie, lang) => {
  const list = movie?.genre?.[lang] || movie?.genre?.uz;
  if (Array.isArray(list) && list[0]) return String(list[0]);
  if (Array.isArray(movie?.filterGenre) && movie.filterGenre[0]) return String(movie.filterGenre[0]);
  return '';
};

const movieRating = (movie) => {
  const raw = movie?.ratingImdb;
  if (raw == null || raw === '' || raw === 'none' || !Number.isFinite(Number(raw))) return '';
  return formatMovieRating(raw);
};

const firstTrailerId = (movie) => {
  const list = movie?.trailersVideo;
  if (!Array.isArray(list) || !list.length) return null;
  const id = list[0]?.id;
  return id == null ? null : id;
};

const useFilmLink = () => useContext(ClipMovieFilmLinkContext);

export const ClipMovieFilmLink = ({ clip, children }) => {
  const { allMovies } = useMoviesApi();
  const [open, setOpen] = useState(false);

  const ids = useMemo(() => movieIdsOf(clip), [clip]);
  const movie = useMemo(() => {
    if (!ids.length || !Array.isArray(allMovies) || allMovies.length === 0) return null;
    const byId = new Map(allMovies.map((item) => [Number(item.id), item]));
    for (const id of ids) {
      const found = byId.get(id);
      if (found) return found;
    }
    return null;
  }, [ids, allMovies]);

  const value = useMemo(
    () => ({
      movie,
      open,
      toggle: () => setOpen((prev) => !prev),
      close: () => setOpen(false),
    }),
    [movie, open]
  );

  return (
    <ClipMovieFilmLinkContext.Provider value={value}>
      {children}
    </ClipMovieFilmLinkContext.Provider>
  );
};

export const ClipMovieFilmButton = () => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const ctx = useFilmLink();
  if (!ctx?.movie?.id) return null;
  const poster = moviePoster(ctx.movie, contentLang);

  return (
    <button
      type="button"
      className={`video-detail-action-btn clip-movie-film-btn${ctx.open ? ' is-open' : ''}`}
      onClick={ctx.toggle}
      aria-expanded={ctx.open}
      aria-label={t('detail.film', 'Film')}
    >
      <span className="clip-movie-film-btn-poster" aria-hidden="true">
        {poster ? <img src={poster} alt="" /> : null}
      </span>
      <span>{t('detail.film', 'Film')}</span>
    </button>
  );
};

export const ClipMovieFilmCard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const ctx = useFilmLink();
  const movie = ctx?.movie;
  if (!ctx?.open || !movie?.id) return null;

  const title = localized(movie.title, contentLang);
  const poster = moviePoster(movie, contentLang);
  const meta = [movieYear(movie, contentLang), movieGenre(movie, contentLang), movieRating(movie)]
    .filter(Boolean)
    .join(' · ');
  const trailerId = firstTrailerId(movie);

  const onWatch = () => {
    navigate(`/movie/${movie.id}`);
  };

  const onTrailer = () => {
    if (trailerId == null) {
      navigate(`/movie/${movie.id}/trailer`);
      return;
    }
    navigate(`/movie/${movie.id}/trailer?trailerId=${trailerId}`);
  };

  return (
    <div className="clip-movie-film-card">
      <p className="clip-movie-film-card-kicker">
        {t('detail.clipSoundtrackFilm', 'Klip soundtracki olingan film')}
      </p>
      <div className="clip-movie-film-card-row">
        <div className="clip-movie-film-card-poster">
          {poster ? <img src={poster} alt="" /> : null}
        </div>
        <div className="clip-movie-film-card-copy">
          {title ? <div className="clip-movie-film-card-title">{title}</div> : null}
          {meta ? <div className="clip-movie-film-card-meta">{meta}</div> : null}
        </div>
      </div>
      <div className="clip-movie-film-card-actions">
        <button type="button" className="clip-movie-film-card-watch" onClick={onWatch}>
          {t('detail.watchMovie', "Filmni ko'rish")}
        </button>
        <button type="button" className="clip-movie-film-card-trailer" onClick={onTrailer}>
          {t('detail.trailer', 'Trailer')}
        </button>
      </div>
    </div>
  );
};

export default ClipMovieFilmLink;
