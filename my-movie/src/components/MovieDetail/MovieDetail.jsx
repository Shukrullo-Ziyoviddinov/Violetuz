import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { allMovies } from '../../data/movies';
import { actors } from '../../data/actors';
import { artists } from '../../dataMusic/artists';
import { useWishlist } from '../../context/WishlistContext';
import { useViewedMovies } from '../../context/ViewedMoviesContext';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import WatchModal from './WatchModal';
import MovieComments from './MovieComments';
import SimilarMovies from './SimilarMovies';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import ImgModal from '../ImgModal/ImgModal';
import VideoModal from '../VideoModal/VideoModal';
import ShareButton from '../ShareButton/ShareButton';
import LikeButton from '../../Music/LikeButton/LikeButton';
import Repost from '../Repost/Repost';
import { formatActionCount } from '../../utils/utils';
import RatingModal from '../Rating/RatingModal';
import { calculateMovieRating, formatMovieRating, getMovieLastVote, submitMovieRating } from '../Rating/CalculateRating';
import '../Rating/CalculateRating.css';
import './MovieDetail.css';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addMovie } = useViewedMovies();
  const [showWatchModal, setShowWatchModal] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState(null);
  const [seasonsLang, setSeasonsLang] = useState(i18n.language === 'uz' ? 'uz' : 'ru');
  const { contentLang } = useContentLanguage();
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [modalStartY, setModalStartY] = useState(0);
  const [modalCurrentY, setModalCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const videoRef = React.useRef(null);
  const modalRef = React.useRef(null);
  const commentsModalRef = useRef(null);
  const [commentsCount, setCommentsCount] = useState(0);
  const [imgModalOpen, setImgModalOpen] = useState(false);
  const [imgModalIndex, setImgModalIndex] = useState(0);
  const [clipModalOpen, setClipModalOpen] = useState(false);
  const [activeClipIdx, setActiveClipIdx] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [movieRatingValue, setMovieRatingValue] = useState(0);
  const [userLastVote, setUserLastVote] = useState(null);
  const modalHeaderRef = React.useRef(null);
  const isDraggingRef = React.useRef(false);
  const modalStartYRef = React.useRef(0);

  const movie = allMovies.find(m => m.id === parseInt(id));

  useEffect(() => {
    if (movie) addMovie(movie);
  }, [movie?.id, addMovie]);

  useEffect(() => {
    setCommentsCount(0);
  }, [movie?.id]);

  useEffect(() => {
    setImgModalOpen(false);
    setImgModalIndex(0);
    setClipModalOpen(false);
    setActiveClipIdx(0);
  }, [movie?.id]);

  useEffect(() => {
    if (!movie) return;
    setMovieRatingValue(calculateMovieRating(movie.id, movie.rating));
    setUserLastVote(getMovieLastVote(movie.id));
  }, [movie]);

  const sceneSrcs = useMemo(() => {
    const raw = movie?.scenes;
    if (!Array.isArray(raw) || !raw.length) return [];
    return raw
      .map((s) => (typeof s === 'string' ? s : s?.src))
      .filter(Boolean);
  }, [movie?.scenes]);

  const clipItems = useMemo(() => {
    const raw = movie?.clips;
    if (!Array.isArray(raw) || !raw.length) return [];
    return raw
      .map((c, i) => {
        if (typeof c === 'string') {
          return { index: i, dataId: i, src: c, title: '' };
        }
        const src = c?.src;
        if (!src) return null;
        let title = '';
        if (c.title) {
          if (typeof c.title === 'object') {
            title = c.title[i18n.language] || c.title.uz || c.title.ru || '';
          } else {
            title = String(c.title);
          }
        }
        return {
          index: i,
          dataId: c.id != null ? c.id : i,
          src,
          title,
        };
      })
      .filter(Boolean);
  }, [movie?.clips, i18n.language]);

  const movieCast = useMemo(() => {
    if (!Array.isArray(movie?.actors)) return [];

    const castItems = movie.actors.map((castId) => {
      const normalizedId = typeof castId === 'number' ? castId : parseInt(castId, 10);
      const actor = Number.isNaN(normalizedId) ? undefined : actors.find((item) => item.id === normalizedId);

      if (actor) {
        return {
          key: `actor-${actor.id}`,
          id: actor.id,
          image: actor.image,
          name: actor.name || {},
          info: actor.info || {},
          route: `/actor/${actor.id}`,
          rawId: castId,
        };
      }

      const artist = artists.find((item) => String(item.id) === String(castId));
      if (!artist) return null;

      return {
        key: `artist-${artist.id}`,
        id: artist.id,
        image: artist.img || artist.imgArtist || '/img/movie1.jpg',
        name: { uz: artist.name, ru: artist.name },
        info: { uz: artist.description || '', ru: artist.description || '' },
        route: `/music/artist/${artist.id}`,
        rawId: castId,
      };
    }).filter(Boolean);

    return castItems;
  }, [movie?.actors]);

  useEffect(() => {
    if (!movie?.seasons?.length) {
      setSelectedSeason(null);
      return;
    }
    if (selectedSeason === null) {
      setSelectedSeason(movie?.seasons?.[0]?.seasonNumber);
    } else {
      const exists = movie?.seasons?.some((s) => s.seasonNumber === selectedSeason);
      if (!exists) setSelectedSeason(movie?.seasons?.[0]?.seasonNumber);
    }
  }, [movie, selectedSeason]);

  useEffect(() => {
    if (!movie?.seasons?.length || selectedSeason == null) return;
    const currentSeason = movie?.seasons?.find((s) => s.seasonNumber === selectedSeason);
    const hasUz = currentSeason?.episodes?.some((ep) => ep.uz && ep.uz !== 'none');
    const hasRu = currentSeason?.episodes?.some((ep) => ep.ru && ep.ru !== 'none');
    if (seasonsLang === 'ru' && !hasRu) setSeasonsLang('uz');
    else if (seasonsLang === 'uz' && !hasUz && hasRu) setSeasonsLang('ru');
  }, [movie, selectedSeason, seasonsLang]);

  useEffect(() => {
    if (showDescriptionModal) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    document.body.style.overflow = '';
  }, [showDescriptionModal]);

  // SEO: title (movies.js), description, og:image, JSON-LD — Google uchun kuchaytirilgan
  useEffect(() => {
    if (!movie) return;
    const lang = contentLang;
    // movies.js title.uz / title.ru — to'g'ri ishlatiladi
    const pageTitle = movie.title?.[lang] || movie.title?.uz || movie.title?.ru || '';
    const pageDesc = getDescriptionText();
    const imgUrl = movie.titleImg?.[lang] || movie.titleImg?.uz || movie.titleImg?.ru
      || movie.homeImg?.[lang] || movie.homeImg?.uz || movie.homeImg?.ru;
    const fullImgUrl = imgUrl ? `${window.location.origin}${imgUrl}` : '';
    const canonicalUrl = `${window.location.origin}/movie/${movie.id}`;
    const genres = movie.genre?.[lang] || movie.genre?.uz || movie.genre?.ru || [];
    const keywords = Array.isArray(genres) ? genres.join(', ') : (genres || '');

    const setMeta = (name, content, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content || '');
    };

    const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // Title — movies.js title.uz / title.ru
    document.title = pageTitle ? `${pageTitle} | Violet Movie - Filmlar onlayn` : 'Violet Movie - Filmlar onlayn';
    setMeta('description', pageDesc?.substring(0, 160) || '');
    setMeta('keywords', `${pageTitle}, ${keywords}, film, kino, online, Violet Movie`.trim());

    // Open Graph
    setMeta('og:title', pageTitle ? `${pageTitle} | Violet Movie` : 'Violet Movie', true);
    setMeta('og:description', pageDesc?.substring(0, 160) || '', true);
    setMeta('og:image', fullImgUrl, true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:type', 'video.movie', true);
    setMeta('og:site_name', 'Violet Movie', true);
    setMeta('og:locale', lang === 'ru' ? 'ru_RU' : 'uz_UZ', true);
    setMeta('og:locale:alternate', lang === 'ru' ? 'uz_UZ' : 'ru_RU', true);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', pageTitle ? `${pageTitle} | Violet Movie` : 'Violet Movie');
    setMeta('twitter:description', pageDesc?.substring(0, 160) || '');
    setMeta('twitter:image', fullImgUrl);

    // Canonical URL
    setLink('canonical', canonicalUrl);

    // JSON-LD — Google rich results (rejting, yil, aktyorlar)
    const descData = movie.description?.[lang] || movie.description?.uz || movie.description?.ru;
    const year = (typeof descData === 'object' && descData?.year) || movie.specs?.year;
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Movie',
      name: pageTitle,
      description: pageDesc?.substring(0, 200) || '',
      image: fullImgUrl,
      datePublished: year ? `${year}-01-01` : undefined,
      ...(movie.ratingImdb && { aggregateRating: { '@type': 'AggregateRating', ratingValue: movie.ratingImdb, bestRating: 10, worstRating: 0 } }),
      ...(Array.isArray(genres) && genres.length && { genre: genres })
    };
    let scriptEl = document.getElementById('movie-json-ld');
    if (scriptEl) scriptEl.remove();
    scriptEl = document.createElement('script');
    scriptEl.id = 'movie-json-ld';
    scriptEl.type = 'application/ld+json';
    scriptEl.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(scriptEl);

    return () => {
      document.title = 'Violet Movie - Filmlar onlayn';
      document.getElementById('movie-json-ld')?.remove();
    };
  }, [movie, contentLang]);

  // Mobile modal touchmove — passive: false (preventDefault uchun)
  const handleModalTouchMove = (e) => {
    if (window.innerWidth <= 768 && isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - modalStartYRef.current;
      if (deltaY > 0) {
        setModalCurrentY(currentY);
      } else {
        setModalCurrentY(modalStartYRef.current);
      }
    }
  };

  useEffect(() => {
    if (!showDescriptionModal || !modalHeaderRef.current) return;
    const el = modalHeaderRef.current;
    const handler = handleModalTouchMove;
    el.addEventListener('touchmove', handler, { passive: false });
    return () => el.removeEventListener('touchmove', handler);
  }, [showDescriptionModal]);

  if (!movie) {
    return (
      <div className="movie-detail-error">
        <h2>Movie not found</h2>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  const getMovieTitle = () => {
    const lang = contentLang;
    if (movie.title && typeof movie.title === 'object') {
      return movie.title[lang] || movie.title.uz || movie.title.ru;
    }
    return movie.title || '';
  };

  const getMovieGenres = () => {
    const lang = contentLang;
    if (movie.genre && typeof movie.genre === 'object') {
      return Array.isArray(movie.genre[lang]) ? movie.genre[lang] : (movie.genre[lang] ? [movie.genre[lang]] : movie.genre.uz || movie.genre.ru || []);
    }
    return Array.isArray(movie.genre) ? movie.genre : [movie.genre || ''];
  };

  const getMovieDescription = () => {
    const lang = contentLang;
    if (movie.description && typeof movie.description === 'object') {
      // Check if it's the new format with text, year, etc.
      if (movie.description[lang] && typeof movie.description[lang] === 'object' && movie.description[lang].text) {
        return movie.description[lang];
      }
      if (movie.description.uz && typeof movie.description.uz === 'object' && movie.description.uz.text) {
        return movie.description.uz;
      }
      if (movie.description.ru && typeof movie.description.ru === 'object' && movie.description.ru.text) {
        return movie.description.ru;
      }
      // Old format - just string
      return movie.description[lang] || movie.description.uz || movie.description.ru;
    }
    return movie.description || '';
  };

  const getDescriptionText = () => {
    const desc = getMovieDescription();
    if (typeof desc === 'object' && desc.text) {
      return desc.text;
    }
    return desc || '';
  };

  const getDescriptionData = () => {
    const desc = getMovieDescription();
    if (typeof desc === 'object' && desc.text) {
      return desc;
    }
    return null;
  };

  const getMovieVideo = () => {
    const lang = contentLang;
    
    if (!movie.movieMedia || typeof movie.movieMedia !== 'object') {
      return null;
    }
    
    const langData = movie.movieMedia[lang] || movie.movieMedia.uz || movie.movieMedia.ru;
    
    if (!langData || typeof langData !== 'object') {
      return null;
    }
    
    if (langData.video && typeof langData.video === 'object') {
      const src = langData.video.src;
      if (src && typeof src === 'string' && src.trim() !== '') {
        return src;
      }
    }
    
    return null;
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Mobile swipe handlers for modal
  const handleModalHeaderTouchStart = (e) => {
    if (window.innerWidth <= 768) {
      e.stopPropagation();
      const touchY = e.touches[0].clientY;
      modalStartYRef.current = touchY;
      isDraggingRef.current = true;
      setIsDragging(true);
      setModalStartY(touchY);
      setModalCurrentY(touchY);
    }
  };

  const handleModalTouchEnd = (e) => {
    if (window.innerWidth <= 768 && isDragging) {
      e.stopPropagation();
      const deltaY = modalCurrentY - modalStartY;
      const screenHeight = window.innerHeight;
      const threshold = screenHeight * 0.1; // 10% of screen
      
      if (deltaY > threshold) {
        setShowDescriptionModal(false);
      }
      
      isDraggingRef.current = false;
      setIsDragging(false);
      setModalCurrentY(0);
      setModalStartY(0);
    }
  };

  const movieVideo = getMovieVideo();
  const descriptionText = getDescriptionText();
  const descriptionData = getDescriptionData();
  const isNewFormat = descriptionData !== null;
  const ratingDisplayValue = formatMovieRating(movieRatingValue ?? movie?.rating);
  const rateLabel = userLastVote
    ? (i18n.language === 'uz' ? `Baho: ${userLastVote}` : `Оценка: ${userLastVote}`)
    : (i18n.language === 'uz' ? 'Baholash' : 'Оценить');

  const bgImageUrl = `${process.env.PUBLIC_URL || ''}/img/photo_2026-02-19_21-28-29.jpg`;

  return (
    <div className="movie-detail">
      <div className="movie-detail-bg-block">
        <div
          className="movie-detail-bg"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.6) 40%, rgba(0, 0, 0, 0.9) 80%, rgba(0, 0, 0, 1) 100%), url("${bgImageUrl}")`,
          }}
        />
        <div className="movie-detail-container">
          <div className="movie-detail-content">
          <div className="movie-detail-image-block">
            <div className="movie-detail-image">
              {movieVideo ? (
                <div className="movie-detail-video-wrapper">
                  <ShareButton movie={movie} />
                  <video 
                    ref={videoRef}
                    src={movieVideo} 
                    alt={getMovieTitle()}
                    className="movie-detail-video"
                    playsInline
                    autoPlay
                    muted={isMuted}
                    loop
                  />
                  <div className="movie-detail-video-controls">
                    <button 
                      className="video-control-btn mute-btn"
                      onClick={toggleMute}
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                          <line x1="23" y1="9" x2="17" y2="15" />
                          <line x1="17" y1="9" x2="23" y2="15" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="movie-detail-video-placeholder">
                  <span>Video topilmadi</span>
                </div>
              )}
            </div>
          </div>

          <div className="movie-detail-info-block">
            <div className="movie-detail-info">
              {movie.titleImg ? (
                <div className="movie-detail-title-img-wrapper">
                  <img
                    src={movie.titleImg[contentLang] || movie.titleImg.uz || movie.titleImg.ru}
                    alt={getMovieTitle()}
                    className="movie-detail-title-img"
                  />
                  <h1 className="movie-detail-title movie-detail-title-sr-only">{getMovieTitle()}</h1>
                </div>
              ) : (
                <h1 className="movie-detail-title">{getMovieTitle()}</h1>
              )}

              <div className="movie-detail-specs">
                {movie.specs && (
                  <ScrollTouch className="movie-detail-specs-container">
                    <div className="movie-detail-spec-item">
                      <span className="movie-detail-spec-label">{t('detail.duration')}</span>
                      <span className="movie-detail-spec-value">{movie.specs.duration} min</span>
                    </div>
                    <div className="movie-detail-spec-item">
                      <span className="movie-detail-spec-label">{t('detail.ageRating')}</span>
                      <span className="movie-detail-spec-value">{movie.specs.ageRating}</span>
                    </div>
                    <div className="movie-detail-spec-item">
                      <span className="movie-detail-spec-label">{t('detail.year')}</span>
                      <span className="movie-detail-spec-value">{movie.specs.year}</span>
                    </div>
                    {movie.specs.countries && movie.specs.countries.length > 0 && (
                      <div className="movie-detail-spec-item">
                        <span className="movie-detail-spec-label">{t('detail.countries')}</span>
                        <span className="movie-detail-spec-value">{movie.specs.countries.join(', ')}</span>
                      </div>
                    )}
                    {movie.specs.languages && movie.specs.languages.length > 0 && (
                      <div className="movie-detail-spec-item">
                        <span className="movie-detail-spec-label">{t('detail.languages')}</span>
                        <span className="movie-detail-spec-value">{movie.specs.languages.join(', ')}</span>
                      </div>
                    )}
                  </ScrollTouch>
                )}
              </div>

              <div className="movie-detail-genre">
                <span className="movie-detail-genre-label">{t('detail.genre')}:</span>
                <div className="movie-detail-genres">
                  {getMovieGenres().map((genre, index) => (
                    <span key={index} className="movie-detail-genre-badge">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              <ScrollTouch className="movie-detail-actions">
                <LikeButton
                  key={movie.id}
                  variant="movieDetail"
                  contentId={String(movie.id)}
                  persistKey={`movie_${movie.id}`}
                  likeMeta={{
                    category: movie.type || 'movie',
                    title: getMovieTitle(),
                    image: movie.homeImg?.[contentLang] || movie.homeImg?.uz || movie.homeImg?.ru || '',
                    route: `/movie/${movie.id}`,
                  }}
                  initialLikeCount={movie.like}
                  initialDislikeCount={movie.dislike}
                  countFormatter={formatActionCount}
                />

                <button
                  className="movie-detail-action-btn movie-detail-action-btn-comment"
                  onClick={() => commentsModalRef.current?.openModal()}
                  aria-label={i18n.language === 'uz' ? 'Izohlar' : 'Комментарии'}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span className="movie-detail-action-count">{formatActionCount(commentsCount)}</span>
                </button>

                <button
                  className="movie-detail-action-btn movie-detail-action-btn-rate"
                  onClick={() => setShowRatingModal(true)}
                  aria-label={i18n.language === 'uz' ? 'Baholash' : 'Оценить'}
                >
                  <span className="movie-detail-rate-icon">★</span>
                  <span className="movie-detail-rate-label">{rateLabel}</span>
                </button>

                <button
                  className={`movie-detail-action-btn movie-detail-action-btn-wishlist ${isInWishlist(movie.id, 'movie') ? 'active' : ''}`}
                  onClick={() => toggleWishlist(movie.id, 'movie')}
                  aria-label="Sevimlilarga qo'shish"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={isInWishlist(movie.id, 'movie') ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </button>
                <Repost
                  className="movie-detail-action-btn"
                  item={{
                    id: movie.id,
                    type: 'movie',
                    title: getMovieTitle(),
                    image: movie.homeImg?.[contentLang] || movie.homeImg?.uz || movie.homeImg?.ru || '/img/movie1.jpg',
                    route: `/movie/${movie.id}`,
                  }}
                />
              </ScrollTouch>

              <div className="movie-detail-rating">
                {movie.category !== 'anonslar' && movie.rating != null && movie.rating !== '' && movie.rating !== 'none' && (
                  <div className="movie-detail-rating-item">
                    <img src="/img/photo_2026-02-16_20-30-31_preview_rev_1.png" alt="Rating" className="movie-detail-rating-logo" />
                    <span className="movie-detail-rating-value rating-value-display">{ratingDisplayValue}</span>
                  </div>
                )}
                {movie.ratingImdb != null && movie.ratingImdb !== '' && movie.ratingImdb !== 'none' && (
                  <div className="movie-detail-rating-item">
                    <img src="/img/imdb.jpg" alt="IMDb" className="movie-detail-rating-logo" />
                    <span className="movie-detail-rating-value">{movie.ratingImdb}</span>
                  </div>
                )}
                {movie.ratingKinopoisk != null && movie.ratingKinopoisk !== '' && movie.ratingKinopoisk !== 'none' && (
                  <div className="movie-detail-rating-item">
                    <img src="/img/kinopoisk.jpg" alt="Kinopoisk" className="movie-detail-rating-logo" />
                    <span className="movie-detail-rating-value">{movie.ratingKinopoisk}</span>
                  </div>
                )}
                {movie.ratingNetflix != null && movie.ratingNetflix !== '' && movie.ratingNetflix !== 'none' && (
                  <div className="movie-detail-rating-item">
                    <img src="/img/netflix.jpg" alt="Netflix" className="movie-detail-rating-logo" />
                    <span className="movie-detail-rating-value">{movie.ratingNetflix}</span>
                  </div>
                )}
              </div>

              <div className="movie-detail-buttons">
                <button
                  className="movie-detail-btn movie-detail-btn-primary"
                  onClick={() => {
                    setSelectedVideoUrl(null);
                    setShowWatchModal(true);
                  }}
                >
                  {t('detail.watch')}
                </button>
                <button
                  className="movie-detail-btn movie-detail-btn-secondary"
                  onClick={() => navigate(`/movie/${movie.id}/trailer`)}
                >
                  {t('detail.trailer')}
                </button>
              </div>

              <div className="movie-detail-description">
                <div className="movie-detail-description-header">
                  <h3>
                    {i18n.language === 'uz' ? 'Film haqida qisqacha' : 'Кратко о фильме'}
                  </h3>
                </div>
                
                <div className="movie-detail-description-text">
                  <p className="movie-detail-description-preview">
                    {descriptionText.length > 150 ? `${descriptionText.substring(0, 150)}...` : descriptionText}
                  </p>
                  <button 
                    className="movie-detail-description-more-btn"
                    onClick={() => setShowDescriptionModal(true)}
                  >
                    {i18n.language === 'uz' ? 'Batafsil' : 'Подробнее'}
                  </button>
                </div>
              </div>

              {movie?.seasons?.length > 0 && (() => {
                const currentSeason = selectedSeason != null
                  ? movie.seasons?.find((s) => s.seasonNumber === selectedSeason)
                  : movie.seasons?.[0];
                const hasUzEpisodes = currentSeason?.episodes?.some((ep) => ep.uz && ep.uz !== 'none');
                const hasRuEpisodes = currentSeason?.episodes?.some((ep) => ep.ru && ep.ru !== 'none');
                return (
                <div className="movie-detail-seasons">
                  <div className="movie-detail-seasons-header">
                    <div className="movie-detail-seasons-tabs">
                      {hasUzEpisodes && (
                        <button
                          className={`movie-detail-seasons-tab ${seasonsLang === 'uz' ? 'active' : ''}`}
                          onClick={() => setSeasonsLang('uz')}
                        >
                          UZ
                        </button>
                      )}
                      {hasRuEpisodes && (
                        <button
                          className={`movie-detail-seasons-tab ${seasonsLang === 'ru' ? 'active' : ''}`}
                          onClick={() => setSeasonsLang('ru')}
                        >
                          RU
                        </button>
                      )}
                    </div>
                    <div className="movie-detail-season-buttons">
                      <ScrollTouch key={i18n.language} className="movie-detail-season-buttons-scroll">
                        {movie.seasons?.map((season) => (
                          <button
                            key={`${season.seasonNumber}-${i18n.language}`}
                            className={`movie-detail-season-btn ${selectedSeason === season.seasonNumber ? 'active' : ''}`}
                            onClick={() => setSelectedSeason(season.seasonNumber)}
                          >
                            {season.title ? (season.title[i18n.language] || season.title.uz || season.title.ru) : (i18n.language === 'uz' ? `Mavsum ${season.seasonNumber}` : `Сезон ${season.seasonNumber}`)}
                          </button>
                        ))}
                      </ScrollTouch>
                    </div>
                  </div>
                  <div className="movie-detail-season-block">
                    {selectedSeason != null && movie.seasons?.filter((s) => s.seasonNumber === selectedSeason)
                      ?.map((season) => (
                        <ScrollTouch key={season.seasonNumber} className="movie-detail-episodes-scroll">
                          {(season.episodes || []).map((ep, epIndex) => {
                            const videoSrc = ep[seasonsLang];
                            if (!videoSrc || videoSrc === 'none') return null;
                            return (
                              <div
                                key={epIndex}
                                className="movie-detail-episode-item"
                                onClick={() => {
                                  setSelectedVideoUrl(videoSrc);
                                  setShowWatchModal(true);
                                }}
                                onMouseEnter={(e) => {
                                  const v = e.currentTarget.querySelector('video');
                                  if (v) v.play().catch(() => {});
                                }}
                                onMouseLeave={(e) => {
                                  const v = e.currentTarget.querySelector('video');
                                  if (v) { v.pause(); v.currentTime = 0; }
                                }}
                              >
                                <video
                                  src={videoSrc}
                                  preload="metadata"
                                  muted
                                  loop
                                  playsInline
                                  className="movie-detail-episode-video"
                                />
                                <span className="movie-detail-episode-number">{epIndex + 1}</span>
                              </div>
                            );
                          })}
                        </ScrollTouch>
                      ))}
                  </div>
                </div>
                );
              })()}

              {movieCast.length > 0 && (() => {
                return (
                  <div className="movie-detail-actors">
                    <h3 className="movie-detail-actors-title">
                      {i18n.language === 'uz' ? 'Aktyorlar' : 'Актеры'}
                    </h3>
                    <div className="movie-detail-actors-scroll">
                      <ScrollTouch className="movie-detail-actors-scroll-inner">
                      <div className="movie-detail-actors-grid">
                      {movieCast.map((actor) => (
                        <div
                          key={actor.key}
                          className="movie-detail-actor-item"
                          onClick={() => navigate(actor.route)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && navigate(actor.route)}
                        >
                          <div className="movie-detail-actor-image">
                            <img src={actor.image} alt={actor.name[contentLang] || actor.name.uz} />
                          </div>
                          <div className="movie-detail-actor-info">
                            <span className="movie-detail-actor-name">
                              {actor.name[contentLang] || actor.name.uz || actor.name.ru}
                              <img src="/img/galichka2.png" alt="" className="movie-detail-actor-name-verified" />
                            </span>
                            <span className="actors-page-movies-title">
                              {allMovies.filter((m) => Array.isArray(m.actors) && m.actors.some((castId) => String(castId) === String(actor.rawId))).length} {i18n.language === 'uz' ? 'ta video' : 'видео'}
                            </span>
                            <p className="movie-detail-actor-desc">
                              {actor.info?.[contentLang] || actor.info?.uz || actor.info?.ru || ''}
                            </p>
                          </div>
                        </div>
                      ))}
                      </div>
                      </ScrollTouch>
                    </div>
                  </div>
                );
              })()}

              {sceneSrcs.length > 0 && (
                <div className="movie-detail-scenes">
                  <h3 className="movie-detail-section-title">
                    {i18n.language === 'uz' ? 'Lavhalar' : 'Кадры'}
                  </h3>
                  <ScrollTouch className="movie-detail-scenes-scroll">
                    {sceneSrcs.map((src, idx) => (
                      <button
                        key={`${src}-${idx}`}
                        type="button"
                        className="movie-detail-scene-item"
                        onClick={() => {
                          setImgModalIndex(idx);
                          setImgModalOpen(true);
                        }}
                      >
                        <img
                          src={encodeURI(src)}
                          alt=""
                          className="movie-detail-scene-img"
                          draggable={false}
                        />
                      </button>
                    ))}
                  </ScrollTouch>
                </div>
              )}

              {clipItems.length > 0 && (
                <div className="movie-detail-clips">
                  <h3 className="movie-detail-section-title">
                    {i18n.language === 'uz' ? 'Video lavhalar' : 'Видео кадры'}
                  </h3>
                  <ScrollTouch className="movie-detail-clips-scroll">
                    {clipItems.map((clip) => (
                      <div
                        key={String(clip.dataId)}
                        className="movie-detail-clip-item"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setActiveClipIdx(clip.index);
                          setClipModalOpen(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setActiveClipIdx(clip.index);
                            setClipModalOpen(true);
                          }
                        }}
                        onMouseEnter={(e) => {
                          const v = e.currentTarget.querySelector('video');
                          if (v) v.play().catch(() => {});
                        }}
                        onMouseLeave={(e) => {
                          const v = e.currentTarget.querySelector('video');
                          if (v) {
                            v.pause();
                            v.currentTime = 0;
                          }
                        }}
                      >
                        <div className="movie-detail-clip-media">
                          <video
                            src={encodeURI(clip.src)}
                            preload="metadata"
                            muted
                            loop
                            playsInline
                            className="movie-detail-clip-video"
                          />
                          <span className="movie-detail-clip-play" aria-hidden />
                        </div>
                        {clip.title ? (
                          <div className="movie-detail-clip-info">
                            <span className="movie-detail-clip-title">{clip.title}</span>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </ScrollTouch>
                </div>
              )}

              <MovieComments
                ref={commentsModalRef}
                movieId={movie.id}
                onCountChange={setCommentsCount}
              />
            </div>
          </div>
        </div>
      </div>
      </div>
      <div className="movie-detail-container movie-detail-similar-wrapper">
        <SimilarMovies currentMovie={movie} />
      </div>

      {showWatchModal && (
        <WatchModal
          movie={movie}
          videoUrl={selectedVideoUrl}
          onClose={() => {
            setShowWatchModal(false);
            setSelectedVideoUrl(null);
          }}
        />
      )}

      <ImgModal
        isOpen={imgModalOpen}
        onClose={() => setImgModalOpen(false)}
        images={sceneSrcs.map((s) => encodeURI(s))}
        currentIndex={imgModalIndex}
        onIndexChange={setImgModalIndex}
      />

      <VideoModal
        isOpen={clipModalOpen}
        onClose={() => setClipModalOpen(false)}
        src={clipItems[activeClipIdx]?.src ? encodeURI(clipItems[activeClipIdx].src) : undefined}
        title={clipItems[activeClipIdx]?.title || ''}
        relatedVideos={
          clipItems.length > 1
            ? clipItems.map((c) => ({
                id: c.index,
                src: encodeURI(c.src),
                title: c.title,
              }))
            : []
        }
        onSelectVideo={clipItems.length > 1 ? (item) => setActiveClipIdx(item.id) : undefined}
        relatedVideosLabel={i18n.language === 'uz' ? 'Boshqa videolar' : 'Другие видео'}
      />

      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        movieTitle={getMovieTitle()}
        language={i18n.language === 'uz' ? 'uz' : 'ru'}
        initialRating={userLastVote}
        onSubmit={(value) => {
          const updated = submitMovieRating(movie.id, movie.rating, value);
          setMovieRatingValue(updated);
          setUserLastVote(value);
        }}
      />

      {showDescriptionModal && (
        <div 
          className={`movie-detail-description-modal ${isDragging ? 'dragging' : ''}`}
          ref={modalRef}
        >
          <div 
            className="movie-detail-description-modal-overlay" 
            onClick={() => {
              if (window.innerWidth > 768) {
                setShowDescriptionModal(false);
              }
            }}
          ></div>
          <div 
            className="movie-detail-description-modal-content"
            style={window.innerWidth <= 768 && isDragging && modalCurrentY > modalStartY ? {
              transform: `translateY(${modalCurrentY - modalStartY}px)`
            } : {}}
          >
            <div 
              ref={modalHeaderRef}
              className="movie-detail-description-modal-header"
              onTouchStart={handleModalHeaderTouchStart}
              onTouchEnd={handleModalTouchEnd}
            >
              <h3>
                {i18n.language === 'uz' ? 'Film haqida qisqacha' : 'Кратко о фильме'}
              </h3>
              <button
                className="movie-detail-description-modal-close"
                onClick={() => setShowDescriptionModal(false)}
                aria-label="Close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
            </div>
            <div className="movie-detail-description-modal-body">
              {isNewFormat ? (
                <>
                  <div className="movie-detail-description-modal-text">
                    <p>{descriptionText}</p>
                  </div>
                  <div className="movie-detail-description-modal-info">
                    <div className="movie-detail-description-info-item">
                      <span className="movie-detail-description-label">
                        {i18n.language === 'uz' ? 'Yil' : 'Год'}
                      </span>
                      <span className="movie-detail-description-value">{descriptionData.year || '-'}</span>
                    </div>
                    <div className="movie-detail-description-info-item">
                      <span className="movie-detail-description-label">
                        {i18n.language === 'uz' ? 'Davlat' : 'Страна'}
                      </span>
                      <span className="movie-detail-description-value">{descriptionData.country || '-'}</span>
                    </div>
                    <div className="movie-detail-description-info-item">
                      <span className="movie-detail-description-label">
                        {t('detail.duration')}
                      </span>
                      <span className="movie-detail-description-value">
                        {descriptionData.duration ? `${descriptionData.duration} min` : '-'}
                      </span>
                    </div>
                    <div className="movie-detail-description-info-item">
                      <span className="movie-detail-description-label">
                        {i18n.language === 'uz' ? 'Janr' : 'Жанр'}
                      </span>
                      <span className="movie-detail-description-value">
                        {descriptionData.genre && Array.isArray(descriptionData.genre) 
                          ? descriptionData.genre.join(', ') 
                          : descriptionData.genre || '-'}
                      </span>
                    </div>
                    <div className="movie-detail-description-info-item">
                      <span className="movie-detail-description-label">
                        {i18n.language === 'uz' ? 'Rejissor' : 'Режиссер'}
                      </span>
                      <span className="movie-detail-description-value">{descriptionData.director || '-'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="movie-detail-description-modal-text">
                  <p>{descriptionText}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetail;