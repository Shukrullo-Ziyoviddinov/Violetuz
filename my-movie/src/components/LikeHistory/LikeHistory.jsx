import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { allMovies } from '../../data/movies';
import { allClipsData, allConcertsData } from '../../dataMusic/wishlistDataConfig';
import { artists } from '../../dataMusic/artists';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useWishlist } from '../../context/WishlistContext';
import '../Movies/Movies.css';
import '../../pageMusic/MusicMorePage.css';
import './LikeHistory.css';

const categoryLabel = {
  movie: 'Kino',
  clip: 'Klip',
  concert: 'Konsert',
};

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('uz-UZ');
  } catch {
    return '';
  }
};

const LikeHistory = ({ items = [], activeCategory = '' }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();

  if (!items.length) {
    return (
      <div className="like-history-empty">
        <img
          className="like-history-empty-img"
          src="/img/LikeHistoryImg_preview_rev_1.png"
          alt=""
          decoding="async"
        />
        <div className="like-history-empty-actions">
          <button
            type="button"
            className="like-history-empty-btn"
            onClick={() => navigate('/')}
          >
            {t('wishlist.tabMovies')}
          </button>
          <button
            type="button"
            className="like-history-empty-btn like-history-empty-btn--music"
            onClick={() => navigate('/music')}
          >
            {t('navbar.music')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`like-history-grid ${(activeCategory === 'clip' || activeCategory === 'concert') ? 'like-history-grid--media' : ''}`}>
      {items.map((item) => {
        const movieIdFromRoute = item.route?.startsWith('/movie/') ? Number(item.route.split('/movie/')[1]) : null;
        const movie = item.category === 'movie' && Number.isFinite(movieIdFromRoute)
          ? allMovies.find((m) => Number(m.id) === movieIdFromRoute)
          : null;
        const movieTitle = movie?.title?.[contentLang] || movie?.title?.uz || movie?.title?.ru || item.title || 'Nomsiz element';
        const movieImage = movie?.homeImg?.[contentLang] || movie?.homeImg?.uz || movie?.homeImg?.ru || item.image;
        const wishlistMovieId =
          movie?.id ?? (Number.isFinite(movieIdFromRoute) ? movieIdFromRoute : null);

        if (item.category === 'movie') {
          const inWishlist = wishlistMovieId != null && isInWishlist(wishlistMovieId, 'movie');
          return (
            <div
              key={item.key}
              className="movies-item like-history-movie-item"
              onClick={() => item.route && navigate(item.route)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && item.route) {
                  e.preventDefault();
                  navigate(item.route);
                }
              }}
            >
              <div className="movies-item-image-wrapper">
                <img src={movieImage || '/img/movie1.jpg'} alt={movieTitle} className="movies-item-image" />
                <button
                  type="button"
                  className={`movies-item-wishlist-btn ${inWishlist ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (wishlistMovieId != null) toggleWishlist(wishlistMovieId, 'movie');
                  }}
                  aria-label={inWishlist ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo‘shish'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
                <div className="movies-item-badge movies-item-badge-fhd">FHD</div>
                {movie?.ageRestriction != null && (
                  <div className="movies-item-badge movies-item-badge-age">{movie.ageRestriction}+</div>
                )}
                {movie?.rating != null && movie.rating !== '' && movie.rating !== 'none' && (
                  <div className="movies-item-rating">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffd700" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span>{movie.rating}</span>
                  </div>
                )}
              </div>
            </div>
          );
        }

        if (item.category === 'clip' || item.category === 'concert') {
          const videoIdFromRoute = item.route?.startsWith('/music/video/') ? Number(item.route.split('/music/video/')[1]) : null;
          const sourceList = item.category === 'concert' ? allConcertsData : allClipsData;
          const mediaItem = Number.isFinite(videoIdFromRoute)
            ? sourceList.find((v) => Number(v.id) === videoIdFromRoute)
            : null;
          const artistName = mediaItem?.artistId
            ? (artists.find((a) => a.id === mediaItem.artistId)?.name || '')
            : '';
          const wlType = item.category === 'concert' ? 'konsert' : 'klip';
          const wlId =
            mediaItem?.id ?? (Number.isFinite(videoIdFromRoute) ? videoIdFromRoute : null);
          const inWishlist = wlId != null && isInWishlist(wlId, wlType);
          return (
            <div
              key={item.key}
              className="music-more-page-item like-history-clip-item"
              onClick={() => item.route && navigate(item.route)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && item.route) {
                  e.preventDefault();
                  navigate(item.route);
                }
              }}
            >
              <div className="music-more-page-item-image-wrapper">
                <img
                  src={item.image || '/img/movie1.jpg'}
                  alt={item.title || 'Liked'}
                  className="music-more-page-item-image"
                />
                <button
                  type="button"
                  className={`music-more-page-item-wishlist-btn ${inWishlist ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (wlId != null) toggleWishlist(wlId, wlType);
                  }}
                  aria-label={inWishlist ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo‘shish'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
                <div className="music-more-page-item-play">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21" />
                  </svg>
                </div>
                <div className="music-more-page-item-info">
                  <h3 className="music-more-page-item-title">{item.title || 'Nomsiz element'}</h3>
                  <p className="music-more-page-item-artist">{artistName || 'Unknown artist'}</p>
                </div>
              </div>
            </div>
          );
        }

        return (
          <button
            key={item.key}
            type="button"
            className="like-history-card"
            onClick={() => {
              if (item.route) navigate(item.route);
            }}
          >
            <div className="like-history-card-image-wrap">
              {item.image ? (
                <img src={item.image} alt={item.title || 'Liked'} className="like-history-card-image" />
              ) : (
                <div className="like-history-card-image-fallback">♥</div>
              )}
              <span className="like-history-card-badge">{categoryLabel[item.category] || 'Boshqa'}</span>
            </div>
            <div className="like-history-card-info">
              <div className="like-history-card-title">{item.title || 'Nomsiz element'}</div>
              <div className="like-history-card-meta">
                <span>{categoryLabel[item.category] || 'Boshqa'}</span>
                <span>{formatDate(item.updatedAt)}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default LikeHistory;
