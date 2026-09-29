import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';
import { useWishlist } from '../../context/WishlistContext';
import '../MusicCards/MusicCards.css';
import './YourMixes.css';

const COVER_LIMIT = 4;

const mixContentType = (value) => {
  const type = String(value || 'music').trim().toLowerCase();
  if (type === 'clip' || type === 'klip') return 'klip';
  return 'music';
};

export const YourMixCard = ({ mix, covers }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const images = (covers || []).slice(0, COVER_LIMIT);
  const count = Array.isArray(mix?.tracks) ? mix.tracks.length : 0;
  const genre = String(mix?.genre || '').trim().toLowerCase();
  const leadId = mix?.tracks?.[0]?.contentId;
  const contentType = String(mix?.contentType || 'music').trim().toLowerCase();
  const isClip = contentType === 'klip' || contentType === 'clip';
  const coverCount = Math.max(images.length, 1);
  const mixType = mixContentType(contentType);
  const wishlistId = genre ? `${mixType}:${genre}` : '';
  const saved = Boolean(wishlistId) && isInWishlist(wishlistId, 'mix');

  const open = () => {
    if (leadId == null || leadId === '') return;
    const params = new URLSearchParams();
    if (mix?.genre) params.set('mix', mix.genre);
    const query = params.toString();
    const path = isClip ? `/music/video/${leadId}` : `/music/${leadId}`;
    navigate(`${path}${query ? `?${query}` : ''}`);
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!wishlistId) return;
    toggleWishlist(wishlistId, 'mix');
  };

  return (
    <div
      className="your-mixes-card"
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
    >
      <div
        className={[
          'your-mixes-cover',
          `your-mixes-cover--${coverCount}`,
          isClip ? 'your-mixes-cover--klip' : '',
        ].filter(Boolean).join(' ')}
        style={{ '--mix-cover-count': coverCount }}
      >
        {images.map((src, index) => (
          <img
            key={`${src}-${index}`}
            src={src}
            alt=""
            style={{ '--mix-cover-index': index }}
          />
        ))}
        <button
          type="button"
          className={`music-cards-item-wishlist-btn${saved ? ' active' : ''}`}
          onClick={handleWishlistClick}
          aria-label={
            saved
              ? t('wishlist.remove', 'Sevimlilardan olib tashlash')
              : t('wishlist.add', "Sevimlilarga qo'shish")
          }
          aria-pressed={saved}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={saved ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <span className="your-mixes-badge" aria-hidden="true">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="7" width="13" height="13" rx="2" />
            <path d="M8 7V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
          </svg>
          <span className="your-mixes-badge-text">Mix</span>
        </span>
      </div>
      <p className="your-mixes-genre">
        {t('music.mixGenreLine', {
          genre,
          defaultValue: 'top {{genre}} janeridagi mixlar',
        })}
      </p>
      <p className="your-mixes-count">
        {isClip
          ? t('music.mixClipCount', {
              count,
              defaultValue: '{{count}} ta klip',
            })
          : t('music.mixTrackCount', {
              count,
              defaultValue: '{{count}} ta musiqa',
            })}
      </p>
    </div>
  );
};

export const YourMixCardSkeleton = () => (
  <div className="your-mixes-card your-mixes-card--skeleton" aria-hidden="true">
    <div className="your-mixes-cover">
      <SkeletonLoader variant="music-cards-image" className="music-cards-item-image-skeleton" />
    </div>
    <SkeletonLoader variant="music-cards-item-title" />
    <SkeletonLoader variant="music-cards-item-artist" />
  </div>
);
