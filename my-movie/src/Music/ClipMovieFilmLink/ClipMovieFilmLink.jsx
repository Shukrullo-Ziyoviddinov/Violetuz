import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { formatMovieRating } from '../../components/Rating/CalculateRating';
import { useDominantColor } from '../../hooks/useDominantColor';
import './ClipMovieFilmLink.css';

const ClipMovieFilmLinkContext = createContext(null);
const MOBILE_MAX = 768;
const stopPortalTouch = (e) => e.stopPropagation();

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
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const closingRef = useRef(false);
  const dragYRef = useRef(0);
  const startYRef = useRef(0);

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

  const openModal = useCallback(() => {
    closingRef.current = false;
    dragYRef.current = 0;
    setDragY(0);
    setDragging(false);
    setDismissing(false);
    if (mounted) {
      setOpen(true);
      return;
    }
    setOpen(false);
    setMounted(true);
  }, [mounted]);

  const closeModal = useCallback(() => {
    if (!mounted || closingRef.current) return;
    closingRef.current = true;
    setDragging(false);
    setDismissing(true);
    setOpen(false);
  }, [mounted]);

  const toggle = useCallback(() => {
    if (mounted && open && !closingRef.current) closeModal();
    else openModal();
  }, [mounted, open, closeModal, openModal]);

  const finishClose = useCallback(() => {
    if (!closingRef.current) return;
    closingRef.current = false;
    setMounted(false);
    setOpen(false);
    dragYRef.current = 0;
    setDragY(0);
    setDragging(false);
    setDismissing(false);
  }, []);

  useEffect(() => {
    closingRef.current = false;
    setMounted(false);
    setOpen(false);
    dragYRef.current = 0;
    setDragY(0);
    setDragging(false);
    setDismissing(false);
  }, [clip?.id]);

  useEffect(() => {
    if (!mounted) return undefined;
    closingRef.current = false;
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (closingRef.current) return;
        setOpen(true);
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !closingRef.current) return undefined;
    if (open && !dismissing) return undefined;
    const t = window.setTimeout(finishClose, 500);
    return () => window.clearTimeout(t);
  }, [mounted, open, dismissing, finishClose]);

  useEffect(() => {
    if (!mounted) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mounted, closeModal]);

  const handleTransitionEnd = useCallback(
    (e) => {
      if (e.target !== e.currentTarget) return;
      if (e.propertyName !== 'transform' && e.propertyName !== 'opacity') return;
      finishClose();
    },
    [finishClose]
  );

  const handleTouchStart = useCallback((e) => {
    if (closingRef.current) return;
    startYRef.current = e.touches[0].clientY;
    dragYRef.current = 0;
    setDragging(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (window.innerWidth > MOBILE_MAX || closingRef.current) return;
    const diff = Math.max(0, e.touches[0].clientY - startYRef.current);
    dragYRef.current = diff;
    setDragY(diff);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (window.innerWidth > MOBILE_MAX || closingRef.current) return;
    const y = dragYRef.current;
    setDragging(false);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (y > 80) {
          closingRef.current = true;
          setDismissing(true);
          const dismissY = Math.max(window.innerHeight, y + 24);
          dragYRef.current = dismissY;
          setDragY(dismissY);
        } else {
          dragYRef.current = 0;
          setDragY(0);
        }
      });
    });
  }, []);

  const value = useMemo(
    () => ({
      movie,
      open,
      mounted,
      dragging,
      dismissing,
      dragY,
      toggle,
      close: closeModal,
      handleTransitionEnd,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
    }),
    [
      movie,
      open,
      mounted,
      dragging,
      dismissing,
      dragY,
      toggle,
      closeModal,
      handleTransitionEnd,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
    ]
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
  const active = ctx.mounted && ctx.open && !ctx.dismissing;

  return (
    <button
      type="button"
      className={`video-detail-action-btn clip-movie-film-btn${active ? ' is-open' : ''}`}
      onClick={ctx.toggle}
      aria-expanded={active}
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
  const poster = moviePoster(movie, contentLang);
  const tint = useDominantColor(poster || null);
  if (!ctx?.mounted || !movie?.id || typeof document === 'undefined') return null;

  const title = localized(movie.title, contentLang);
  const rating = movieRating(movie);
  const textMeta = [movieYear(movie, contentLang), movieGenre(movie, contentLang)]
    .filter(Boolean)
    .join(' · ');
  const trailerId = firstTrailerId(movie);

  const onWatch = () => {
    ctx.close();
    navigate(`/movie/${movie.id}`);
  };

  const onTrailer = () => {
    ctx.close();
    if (trailerId == null) {
      navigate(`/movie/${movie.id}/trailer`);
      return;
    }
    navigate(`/movie/${movie.id}/trailer?trailerId=${trailerId}`);
  };

  return createPortal(
    <>
      <div
        className={`clip-movie-film-modal-overlay${
          ctx.open && !ctx.dismissing ? ' is-open' : ''
        }`}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          ctx.close();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchStart={stopPortalTouch}
        onTouchMove={stopPortalTouch}
        onTouchEnd={stopPortalTouch}
        onTouchCancel={stopPortalTouch}
      />
      <div
        className={`clip-movie-film-modal clip-movie-film-card${
          ctx.open ? ' is-open' : ''
        }${ctx.dragging ? ' is-dragging' : ''}${tint ? ' has-tint' : ''}`}
        style={{
          '--drag-y': `${ctx.dragY}px`,
          ...(tint ? { '--clip-movie-film-tint': `${tint.r}, ${tint.g}, ${tint.b}` } : {}),
        }}
        role="dialog"
        aria-modal="true"
        aria-label={t('detail.clipSoundtrackFilm', 'video klip Ijrosidagi kino')}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={stopPortalTouch}
        onTouchMove={stopPortalTouch}
        onTouchEnd={stopPortalTouch}
        onTouchCancel={stopPortalTouch}
        onTransitionEnd={ctx.handleTransitionEnd}
      >
        <div
          className="clip-movie-film-modal-header"
          onTouchStart={ctx.handleTouchStart}
          onTouchMove={ctx.handleTouchMove}
          onTouchEnd={ctx.handleTouchEnd}
        >
          <div className="clip-movie-film-modal-drag-handle" />
        </div>
        <div className="clip-movie-film-card-kicker-row">
          <p className="clip-movie-film-card-kicker">
            {t('detail.clipSoundtrackFilm', 'video klip Ijrosidagi kino')}
          </p>
          <button
            type="button"
            className="clip-movie-film-modal-close"
            onClick={ctx.close}
            aria-label={t('common.close', 'Yopish')}
          >
            ×
          </button>
        </div>
        <div className="clip-movie-film-card-row">
          <div className="clip-movie-film-card-poster">
            {poster ? <img src={poster} alt="" /> : null}
          </div>
          <div className="clip-movie-film-card-copy">
            {title ? <div className="clip-movie-film-card-title">{title}</div> : null}
            {textMeta || rating ? (
              <div className="clip-movie-film-card-meta">
                {textMeta}
                {textMeta && rating ? ' · ' : null}
                {rating ? (
                  <span className="clip-movie-film-card-rating" aria-label={`IMDb ${rating}`}>
                    <img className="clip-movie-film-card-imdb" src="/img/imdbnew.png" alt="" />
                    {rating}
                  </span>
                ) : null}
              </div>
            ) : null}
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
    </>,
    document.body
  );
};

export default ClipMovieFilmLink;
