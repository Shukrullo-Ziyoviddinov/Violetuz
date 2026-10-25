import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAppSelector } from '../../store/hooks';
import { selectAuthReady, selectIsLoggedIn } from '../../store/slices/userSlice';
import './ClipMovieOverlay.css';

const SHOW_AFTER_RATIO = 0.2;

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

const reachedRatio = (video) => {
  if (!video) return false;
  const duration = Number(video.duration);
  const time = Number(video.currentTime);
  if (!Number.isFinite(duration) || duration <= 0) return false;
  if (!Number.isFinite(time) || time < 0) return false;
  return time / duration >= SHOW_AFTER_RATIO;
};

const useWishlistPending = () => {
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const status = useAppSelector((state) => state.wishlist.status);
  if (!authReady) return true;
  return isLoggedIn && status !== 'ready' && status !== 'error';
};

const ClipMovieOverlay = ({ clip, video }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { allMovies } = useMoviesApi();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wishlistPending = useWishlistPending();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

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

  const clipKey = clip?.id;
  const movieKey = movie?.id;

  useEffect(() => {
    setDismissed(false);
    setVisible(false);
  }, [clipKey, movieKey, video]);

  useEffect(() => {
    if (!video || !movie?.id) {
      setVisible(false);
      return undefined;
    }

    const sync = () => {
      setVisible(reachedRatio(video));
    };

    sync();
    video.addEventListener('timeupdate', sync);
    video.addEventListener('seeked', sync);
    video.addEventListener('ended', sync);
    video.addEventListener('play', sync);
    video.addEventListener('loadedmetadata', sync);
    return () => {
      video.removeEventListener('timeupdate', sync);
      video.removeEventListener('seeked', sync);
      video.removeEventListener('ended', sync);
      video.removeEventListener('play', sync);
      video.removeEventListener('loadedmetadata', sync);
    };
  }, [video, movie?.id]);

  if (!movie?.id || dismissed || !visible) return null;

  const title = localized(movie.title, contentLang);
  const poster = moviePoster(movie, contentLang);
  const saved = isInWishlist(movie.id, 'movie');
  const saveLabel = t('detail.save', 'Saqlash');

  const stop = (event) => {
    event.stopPropagation();
  };

  const onWatch = (event) => {
    stop(event);
    navigate(`/movie/${movie.id}`);
  };

  const onSave = (event) => {
    stop(event);
    if (wishlistPending) return;
    toggleWishlist(movie.id, 'movie');
  };

  const onClose = (event) => {
    stop(event);
    setDismissed(true);
  };

  return (
    <div className="clip-movie-overlay" onClick={stop} onTouchStart={stop}>
      <button
        type="button"
        className="clip-movie-overlay-close"
        onClick={onClose}
        aria-label={t('common.close', 'Yopish')}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <div className="clip-movie-overlay-card">
        <div className="clip-movie-overlay-poster">
          {poster ? <img src={poster} alt="" /> : null}
        </div>
        <div className="clip-movie-overlay-copy">
          <span className="clip-movie-overlay-kicker">
            {t('detail.clipSoundtrackMovie', 'Soundtrack filmdan')}
          </span>
          {title ? <span className="clip-movie-overlay-title">{title}</span> : null}
        </div>
        <button type="button" className="clip-movie-overlay-watch" onClick={onWatch}>
          {t('detail.watch', "Ko'rish")}
        </button>
        <button
          type="button"
          className={`clip-movie-overlay-save${saved ? ' is-saved' : ''}`}
          onClick={onSave}
          aria-label={saveLabel}
          aria-pressed={saved}
          disabled={wishlistPending}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={saved ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ClipMovieOverlay;
