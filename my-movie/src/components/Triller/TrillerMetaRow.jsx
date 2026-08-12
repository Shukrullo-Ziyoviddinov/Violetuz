import React from 'react';

const ThumbUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
  </svg>
);

const ThumbDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
  </svg>
);

const formatRating = (value) => {
  if (value == null || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
};

/**
 * Title ostidagi meta: like/dislike (hozircha bosilmaydi) + IMDb/Kinopoisk.
 */
const TrillerMetaRow = ({
  like = 0,
  dislike = 0,
  reytingImdb,
  reytingKinopoisk,
  className = '',
}) => {
  const imdbLabel = formatRating(reytingImdb);
  const kpLabel = formatRating(reytingKinopoisk);

  return (
    <div className={`triller-meta-row${className ? ` ${className}` : ''}`} aria-label="Reytinglar">
      <div className="triller-meta-likes">
        <span className="triller-meta-chip triller-meta-like" aria-label={`Like ${like}`}>
          <ThumbUpIcon />
          <span>{like}</span>
        </span>
        <span className="triller-meta-chip triller-meta-dislike" aria-label={`Dislike ${dislike}`}>
          <ThumbDownIcon />
          <span>{dislike}</span>
        </span>
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
