import React from 'react';
import { Link } from 'react-router-dom';
import { getLocalizedField, getShortsSpecValues } from '../../utils/shortsMovieUtils';

const ShortsMovieHead = ({ item, contentLang = 'uz', onWatchClick }) => {
  const title = getLocalizedField(item?.title, contentLang);
  const img = getLocalizedField(item?.homeImg, contentLang);
  const rating = item?.rating;
  const specValues = getShortsSpecValues(item?.specs);

  if (!title && !img && rating == null && !specValues.length) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    onWatchClick?.();
  };

  const inner = (
    <>
      {img ? (
        <img src={img} alt="" className="shorts-modal-movie-poster" />
      ) : null}
      <div className="shorts-modal-movie-meta">
        {title ? (
          <div className="shorts-modal-movie-title-row">
            <h3 className="shorts-modal-title">{title}</h3>
          </div>
        ) : null}
        {(rating != null && rating !== '') || specValues.length > 0 ? (
          <div className="shorts-modal-movie-specs">
            {rating != null && rating !== '' ? (
              <span className="shorts-modal-movie-rating">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {rating}
              </span>
            ) : null}
            {specValues.map((val, index) => (
              <span key={`${val}-${index}`} className="shorts-modal-movie-spec">{val}</span>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );

  if (item?.movieId == null) {
    return <div className="shorts-modal-movie-head">{inner}</div>;
  }

  return (
    <Link
      to={`/movie/${item.movieId}`}
      className="shorts-modal-movie-head"
      onClick={handleClick}
      aria-label={title || undefined}
    >
      {inner}
    </Link>
  );
};

export default ShortsMovieHead;
