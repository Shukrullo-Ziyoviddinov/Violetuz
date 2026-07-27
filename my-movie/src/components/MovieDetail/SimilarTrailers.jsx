import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { formatActionCount } from '../../utils/utils';
import LikeButton from '../../Music/LikeButton/LikeButton';
import VerticalScroll from './VerticalScroll';
import './SimilarTrailers.css';

/** Video ijro etilmasdan, metadata dan lavha (still frame) ko‘rsatadi */
const showTrailerPreviewFrame = (e) => {
  const video = e.currentTarget;
  if (!video || video.dataset.previewReady === '1') return;
  const seekToPreview = () => {
    try {
      const duration = Number(video.duration);
      const t = Number.isFinite(duration) && duration > 0
        ? Math.min(1, Math.max(0.1, duration * 0.08))
        : 0.1;
      video.currentTime = t;
      video.dataset.previewReady = '1';
    } catch {
      /* ignore seek errors */
    }
  };
  if (video.readyState >= 1) seekToPreview();
};

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
  const { allMovies } = useMoviesApi();

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
      .filter((trailer) => trailer.typeTrailers === currentTypeTrailers);
  }, [allMovies, currentTypeTrailers]);

  const selectedKey = selectedTrailer
    ? (getTrailerKey
        ? getTrailerKey(selectedTrailer)
        : `${selectedTrailer.movieId ?? currentMovie?.id}-${selectedTrailer.id}`)
    : null;

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
            const isActive = selectedKey != null && tKey === selectedKey;
            return (
              <div
                key={`${trailer.movieId}-${trailer.id}`}
                className={`similar-trailer-item${isActive ? ' active' : ''}`}
                onClick={() => onTrailerSelect(trailer)}
              >
                <div className="similar-trailer-video">
                  <video
                    src={trailer.trailers?.[contentLang] || trailer.trailers?.uz || trailer.trailers?.ru || ''}
                    muted
                    playsInline
                    preload="metadata"
                    className="similar-trailer-video-element"
                    onLoadedMetadata={showTrailerPreviewFrame}
                    onLoadedData={showTrailerPreviewFrame}
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
