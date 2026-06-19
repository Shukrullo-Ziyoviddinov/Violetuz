import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { allMovies } from '../../data/movies';
import { formatActionCount } from '../../utils/utils';
import LikeButton from '../../Music/LikeButton/LikeButton';
import VerticalScroll from './VerticalScroll';
import './SimilarTrailers.css';

const SimilarTrailers = ({
  currentMovie,
  selectedTrailer,
  onTrailerSelect,
  getTrailerKey,
  trailerLoading = false,
  hideTitleOnMobile = false,
}) => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();

  const currentTypeTrailers = selectedTrailer?.typeTrailers || '';

  const similarTrailers = useMemo(() => {
    if (!currentTypeTrailers) return [];
    return allMovies
      .flatMap((movie) =>
        (movie.trailersVideo || []).map((trailer) => ({
          ...trailer,
          movieId: movie.id,
          movieTitle: movie.title,
        }))
      )
      .filter((trailer) => {
        if (trailer.typeTrailers !== currentTypeTrailers) return false;
        if (trailer.movieId === currentMovie?.id && trailer.id === selectedTrailer?.id) {
          return false;
        }
        return true;
      });
  }, [currentMovie?.id, currentTypeTrailers, selectedTrailer?.id]);

  const titleClassName = `similar-trailers-title${hideTitleOnMobile ? ' similar-trailers-title--desktop-only' : ''}`;

  if (trailerLoading) {
    return (
      <div className="similar-trailers-container similar-trailers-container--loading">
        <h4 className={titleClassName}>{t('detail.similarTrailers')}</h4>
        <div className="similar-trailers-loading-panel" aria-hidden="true" />
      </div>
    );
  }

  if (similarTrailers.length === 0) {
    return (
      <div className="similar-trailers-container">
        <h4 className={titleClassName}>{t('detail.similarTrailers')}</h4>
        <div className="similar-trailers-no-trailers">
          <p>{t('detail.noSimilarTrailers') || 'No similar trailers available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="similar-trailers-container">
      <h4 className={titleClassName}>{t('detail.similarTrailers')}</h4>
      <VerticalScroll className="similar-trailers-scroll-wrapper">
        <div className="similar-trailers-list">
          {similarTrailers.map((trailer) => {
            const tKey = getTrailerKey ? getTrailerKey(trailer) : `${trailer.movieId}-${trailer.id}`;
            return (
              <div
                key={`${trailer.movieId}-${trailer.id}`}
                className="similar-trailer-item"
                onClick={() => onTrailerSelect(trailer)}
              >
                <div className="similar-trailer-video">
                  <video
                    src={trailer.trailers?.[contentLang] || trailer.trailers?.uz || trailer.trailers?.ru || ''}
                    muted
                    playsInline
                    preload="none"
                    className="similar-trailer-video-element"
                  />
                  <div className="similar-trailer-play">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
                <div className="similar-trailer-info">
                  <div className="similar-trailer-title">
                    {trailer.title?.[contentLang] || trailer.title?.uz || trailer.title?.ru || ''}
                  </div>
                  <div className="similar-trailer-text">
                    {trailer.text?.[contentLang] || trailer.text?.uz || trailer.text?.ru || ''}
                  </div>
                  <div className="similar-trailer-actions">
                    <LikeButton
                      key={tKey}
                      variant="trailerSimilar"
                      contentId={tKey}
                      persistTrailerKey={tKey}
                      initialLikeCount={trailer.like}
                      initialDislikeCount={trailer.dislike}
                      countFormatter={formatActionCount}
                      stopPropagation
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </VerticalScroll>
    </div>
  );
};

export default SimilarTrailers;
