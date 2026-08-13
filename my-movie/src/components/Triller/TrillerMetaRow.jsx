import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import LikeButton from '../../Music/LikeButton/LikeButton';
import ShareButton from '../ShareButton/ShareButton';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useWishlist } from '../../context/WishlistContext';
import { formatActionCount } from '../../utils/utils';

const formatRating = (value) => {
  if (value == null || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
};

/**
 * Title ostidagi meta: like/dislike + reytinglar | ulashish + saqlash.
 */
const TrillerMetaRow = ({
  trillerId,
  like = 0,
  dislike = 0,
  reytingImdb,
  reytingKinopoisk,
  title = '',
  image = '',
  className = '',
  loading = false,
}) => {
  const { t } = useTranslation();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const imdbLabel = formatRating(reytingImdb);
  const kpLabel = formatRating(reytingKinopoisk);
  const persistKey = trillerId != null ? `triller-${trillerId}` : undefined;
  const saved = trillerId != null && isInWishlist(trillerId, 'triller');

  const likeMeta = useMemo(() => {
    if (trillerId == null) return undefined;
    return {
      category: 'other',
      title: title || '',
      image: image || '',
      route: `/triller/${trillerId}`,
    };
  }, [trillerId, title, image]);

  const shareMovie = useMemo(
    () => ({
      id: trillerId,
      title: title || '',
    }),
    [trillerId, title]
  );

  if (loading) {
    return (
      <ScrollTouch
        className={`triller-meta-row${className ? ` ${className}` : ''}`}
        aria-hidden="true"
      >
        <div className="triller-meta-left">
          <div className="triller-meta-likes">
            <SkeletonLoader variant="triller-meta-like" />
            <SkeletonLoader variant="triller-meta-like" />
          </div>
          <div className="triller-meta-ratings">
            <SkeletonLoader variant="triller-meta-rating" />
            <SkeletonLoader variant="triller-meta-rating" />
          </div>
        </div>
        <div className="triller-meta-actions">
          <SkeletonLoader variant="triller-meta-save" />
          <SkeletonLoader variant="triller-meta-save" />
        </div>
      </ScrollTouch>
    );
  }

  return (
    <ScrollTouch
      className={`triller-meta-row${className ? ` ${className}` : ''}`}
      aria-label="Reytinglar"
    >
      <div className="triller-meta-left">
        <div className="triller-meta-likes">
          <LikeButton
            key={persistKey || 'triller-like'}
            variant="trailerModal"
            contentId={trillerId}
            persistKey={persistKey}
            initialLikeCount={like}
            initialDislikeCount={dislike}
            countFormatter={formatActionCount}
            likeMeta={likeMeta}
          />
        </div>

        <div className="triller-meta-ratings">
          {imdbLabel != null ? (
            <span className="triller-meta-rating" aria-label={`IMDb ${imdbLabel}`}>
              <img className="triller-meta-rating-img" src="/img/imdbnew.png" alt="" />
              <span className="triller-meta-rating-value">{imdbLabel}</span>
            </span>
          ) : null}
          {kpLabel != null ? (
            <span className="triller-meta-rating" aria-label={`Kinopoisk ${kpLabel}`}>
              <img className="triller-meta-rating-img" src="/img/kinopoisk.jpg" alt="" />
              <span className="triller-meta-rating-value">{kpLabel}</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="triller-meta-actions">
        <div className="triller-meta-share-wrap">
          <ShareButton
            movie={shareMovie}
            dropdownInPortal
            icon="send"
            label={t('share.share', 'Ulashish')}
          />
        </div>
        <button
          type="button"
          className={`triller-meta-save-btn${saved ? ' is-active' : ''}`}
          onClick={() => trillerId != null && toggleWishlist(trillerId, 'triller')}
          aria-label={t('wishlist.save', 'Saqlash')}
          aria-pressed={saved}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill={saved ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <span>{t('wishlist.save', 'Saqlash')}</span>
        </button>
      </div>
    </ScrollTouch>
  );
};

export default TrillerMetaRow;
