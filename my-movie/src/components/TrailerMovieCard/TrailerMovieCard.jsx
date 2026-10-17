import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { formatMovieRating } from '../Rating/CalculateRating';
import './TrailerMovieCard.css';

const SHOW_AFTER_SECONDS = 10;

const localized = (value, lang) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.uz || value.ru || '';
};

const moviePoster = (movie, lang) =>
  localized(movie?.homeImg, lang)
  || localized(movie?.image, lang)
  || '';

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

const TrailerMovieCardView = ({ movie, mode, onWatch, onReplay }) => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const title = localized(movie?.title, contentLang);
  const poster = moviePoster(movie, contentLang);
  const meta = [movieYear(movie, contentLang), movieGenre(movie, contentLang), movieRating(movie)]
    .filter(Boolean)
    .join(' · ');

  if (mode === 'ended') {
    return (
      <div className="trailer-movie-card trailer-movie-card--ended" role="dialog" aria-label={title}>
        <div className="trailer-movie-card-poster trailer-movie-card-poster--ended">
          {poster ? <img src={poster} alt="" /> : null}
        </div>
        <div className="trailer-movie-card-copy">
          <div className="trailer-movie-card-title">{title}</div>
          {meta ? <div className="trailer-movie-card-meta">{meta}</div> : null}
          <button type="button" className="trailer-movie-card-btn trailer-movie-card-btn--primary" onClick={onWatch}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="6 4 20 12 6 20" />
            </svg>
            {t('detail.watchNow', "Hozir ko'rish")}
          </button>
          <button type="button" className="trailer-movie-card-btn trailer-movie-card-btn--ghost" onClick={onReplay}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6a6 6 0 0 1-6 6 6 6 0 0 1-5.65-4H4.26A8 8 0 0 0 12 21a8 8 0 0 0 0-16z" />
            </svg>
            {t('detail.watchAgain', "Qayta ko'rish")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trailer-movie-card trailer-movie-card--dock">
      <div className="trailer-movie-card-poster">
        {poster ? <img src={poster} alt="" /> : null}
      </div>
      <div className="trailer-movie-card-copy">
        <div className="trailer-movie-card-title">{title}</div>
        {meta ? <div className="trailer-movie-card-meta">{meta}</div> : null}
      </div>
      <button type="button" className="trailer-movie-card-btn trailer-movie-card-btn--primary" onClick={onWatch}>
        {t('detail.watch', "Ko'rish")}
      </button>
    </div>
  );
};

/**
 * Mobil treyler kartochkasi.
 * Video 10 soniyaga yetganda pastdan chiqadi.
 * Video tugaganda pastdagi yopiladi va pleer maydonini to‘ldiradi.
 */
const TrailerMovieCard = ({ movie, video, controlsOpen = false }) => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('hidden');
  const [dockShown, setDockShown] = useState(false);

  useEffect(() => {
    if (!video || !movie?.id) {
      setPhase('hidden');
      return undefined;
    }

    const sync = () => {
      if (video.ended) {
        setPhase('ended');
        return;
      }
      setPhase(video.currentTime >= SHOW_AFTER_SECONDS ? 'dock' : 'hidden');
    };

    sync();
    video.addEventListener('timeupdate', sync);
    video.addEventListener('seeked', sync);
    video.addEventListener('ended', sync);
    video.addEventListener('play', sync);
    video.addEventListener('emptied', sync);
    return () => {
      video.removeEventListener('timeupdate', sync);
      video.removeEventListener('seeked', sync);
      video.removeEventListener('ended', sync);
      video.removeEventListener('play', sync);
      video.removeEventListener('emptied', sync);
    };
  }, [video, movie?.id]);

  useEffect(() => {
    if (phase !== 'dock') {
      setDockShown(false);
      return undefined;
    }
    const frame = window.requestAnimationFrame(() => setDockShown(true));
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

  if (!movie?.id || phase === 'hidden') return null;

  const stop = (event) => {
    event.stopPropagation();
  };

  const onWatch = (event) => {
    stop(event);
    navigate(`/movie/${movie.id}`);
  };

  const onReplay = (event) => {
    stop(event);
    if (!video) return;
    video.currentTime = 0;
    const play = video.play();
    if (play && typeof play.catch === 'function') play.catch(() => {});
  };

  return (
    <div
      className={`trailer-movie-card-host${phase === 'ended' ? ' is-ended' : ''}${controlsOpen ? ' is-controls-open' : ''}`}
      onClick={stop}
      onTouchStart={stop}
      onTouchEnd={stop}
    >
      {phase === 'ended' ? (
        <TrailerMovieCardView movie={movie} mode="ended" onWatch={onWatch} onReplay={onReplay} />
      ) : (
        <div className={`trailer-movie-card-dock${dockShown ? ' is-visible' : ''}`}>
          <TrailerMovieCardView movie={movie} mode="dock" onWatch={onWatch} onReplay={onReplay} />
        </div>
      )}
    </div>
  );
};

export default TrailerMovieCard;
