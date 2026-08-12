import React, { useMemo } from 'react';
import LikeButton from '../../Music/LikeButton/LikeButton';
import { formatActionCount } from '../../utils/utils';

const formatRating = (value) => {
  if (value == null || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
};

/**
 * Title ostidagi meta: LikeButton (likesSlice) + IMDb/Kinopoisk.
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
}) => {
  const imdbLabel = formatRating(reytingImdb);
  const kpLabel = formatRating(reytingKinopoisk);
  const persistKey = trillerId != null ? `triller-${trillerId}` : undefined;

  const likeMeta = useMemo(() => {
    if (trillerId == null) return undefined;
    return {
      category: 'other',
      title: title || '',
      image: image || '',
      route: `/triller/${trillerId}`,
    };
  }, [trillerId, title, image]);

  return (
    <div className={`triller-meta-row${className ? ` ${className}` : ''}`} aria-label="Reytinglar">
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
            <img className="triller-meta-rating-img" src="/img/imdb.jpg" alt="" />
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
  );
};

export default TrillerMetaRow;
