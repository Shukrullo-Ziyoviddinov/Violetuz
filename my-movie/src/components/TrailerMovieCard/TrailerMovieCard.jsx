import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useWishlist } from '../../context/WishlistContext';
import { useDominantColor } from '../../hooks/useDominantColor';
import { formatMovieRating } from '../Rating/CalculateRating';
import './TrailerMovieCard.css';

const SHOW_AFTER_SECONDS = 10;
const DOCK_SLIDE_MS = 650;

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

const SaveButton = ({ movieId }) => {
  const { t } = useTranslation();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const saved = isInWishlist(movieId, 'movie');
  const label = t('detail.save', 'Saqlash');

  const onSave = (event) => {
    event.stopPropagation();
    toggleWishlist(movieId, 'movie');
  };

  return (
    <button
      type="button"
      className={`trailer-movie-card-save${saved ? ' is-saved' : ''}`}
      onClick={onSave}
      aria-label={label}
      aria-pressed={saved}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );
};

const TrailerMovieCardView = ({ movie, mode, onWatch, onReplay }) => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const title = localized(movie?.title, contentLang);
  const poster = moviePoster(movie, contentLang);
  const rating = movieRating(movie);
  const textMeta = [movieYear(movie, contentLang), movieGenre(movie, contentLang)]
    .filter(Boolean)
    .join(' · ');
  const meta = textMeta || rating ? (
    <div className="trailer-movie-card-meta">
      {textMeta}
      {textMeta && rating ? ' · ' : null}
      {rating ? (
        <span className="trailer-movie-card-rating" aria-label={`IMDb ${rating}`}>
          <img className="trailer-movie-card-imdb" src="/img/imdbnew.png" alt="" />
          {rating}
        </span>
      ) : null}
    </div>
  ) : null;

  if (mode === 'ended') {
    return (
      <div className="trailer-movie-card trailer-movie-card--ended" role="dialog" aria-label={title}>
        <div className="trailer-movie-card-poster trailer-movie-card-poster--ended">
          {poster ? <img src={poster} alt="" /> : null}
        </div>
        <div className="trailer-movie-card-copy">
          <div className="trailer-movie-card-head">
            <div className="trailer-movie-card-title">{title}</div>
            {meta}
          </div>
          <div className="trailer-movie-card-actions">
          <div className="trailer-movie-card-row">
            <button type="button" className="trailer-movie-card-btn trailer-movie-card-btn--primary" onClick={onWatch}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="6 4 20 12 6 20" />
              </svg>
              {t('detail.watchNow', "Hozir ko'rish")}
            </button>
            <SaveButton movieId={movie.id} />
          </div>
          <button type="button" className="trailer-movie-card-btn trailer-movie-card-btn--ghost" onClick={onReplay}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6a6 6 0 0 1-6 6 6 6 0 0 1-5.65-4H4.26A8 8 0 0 0 12 21a8 8 0 0 0 0-16z" />
            </svg>
            {t('detail.watchAgain', "Qayta ko'rish")}
          </button>
          </div>
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
        {meta}
      </div>
      <button type="button" className="trailer-movie-card-btn trailer-movie-card-btn--primary" onClick={onWatch}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <polygon points="6 4 20 12 6 20" />
        </svg>
        {t('detail.watchShort', 'Tomosha')}
      </button>
      <SaveButton movieId={movie.id} />
    </div>
  );
};

/**
 * Treyler kartochkasi.
 * Mobilda video 10 soniyaga yetganda sahifa pastidan chiqadi. X bilan yopiladi.
 * Video tugaganda pastdagi yo‘qoladi, pleer maydonini to‘ldiradi (mobil va desktop).
 */
const TrailerMovieCard = ({ movie, video }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const tint = useDominantColor(moviePoster(movie, contentLang) || null);
  const [phase, setPhase] = useState('hidden');
  const [dockShown, setDockShown] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    setDismissed(false);
    setClosing(false);
  }, [movie?.id, video]);

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
    const onNewSource = () => {
      setDismissed(false);
      setClosing(false);
      sync();
    };

    sync();
    video.addEventListener('timeupdate', sync);
    video.addEventListener('seeked', sync);
    video.addEventListener('ended', sync);
    video.addEventListener('play', sync);
    video.addEventListener('emptied', sync);
    video.addEventListener('loadstart', onNewSource);
    return () => {
      video.removeEventListener('timeupdate', sync);
      video.removeEventListener('seeked', sync);
      video.removeEventListener('ended', sync);
      video.removeEventListener('play', sync);
      video.removeEventListener('emptied', sync);
      video.removeEventListener('loadstart', onNewSource);
    };
  }, [video, movie?.id]);

  const dockActive = phase === 'dock' && !dismissed;

  useEffect(() => {
    if (!dockActive) {
      setDockShown(false);
      setClosing(false);
      return undefined;
    }
    let second = 0;
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => setDockShown(true));
    });
    return () => {
      window.cancelAnimationFrame(first);
      window.cancelAnimationFrame(second);
    };
  }, [dockActive]);

  useEffect(() => {
    if (!closing) return undefined;
    const timer = window.setTimeout(() => setDismissed(true), DOCK_SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [closing]);

  if (!movie?.id) return null;

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

  const onDismiss = (event) => {
    stop(event);
    if (closing) return;
    setDockShown(false);
    setClosing(true);
  };

  if (phase === 'ended') {
    return (
      <div
        className="trailer-movie-card-host is-ended"
        onClick={stop}
        onTouchStart={stop}
        onTouchEnd={stop}
      >
        <TrailerMovieCardView movie={movie} mode="ended" onWatch={onWatch} onReplay={onReplay} />
      </div>
    );
  }

  if (!dockActive || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`trailer-movie-card-dock${dockShown ? ' is-visible' : ''}${tint ? ' has-tint' : ''}`}
      style={tint ? { '--trailer-card-tint': `${tint.r}, ${tint.g}, ${tint.b}` } : undefined}
      onClick={stop}
      onTouchStart={stop}
      onTouchEnd={stop}
    >
      <button
        type="button"
        className="trailer-movie-card-close"
        onClick={onDismiss}
        aria-label={t('common.close', 'Yopish')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <TrailerMovieCardView movie={movie} mode="dock" onWatch={onWatch} onReplay={onReplay} />
    </div>,
    document.body
  );
};

export default TrailerMovieCard;
