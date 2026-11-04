import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useChannelHomeFeed } from '../../hooks/useChannelHomeFeed';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { SearchModalTavsiyaItem } from '../SearchModalTavsiya/SearchModalTavsiya';
import '../SearchModalTavsiya/SearchModalTavsiya.css';

const sameChannel = (movie, channelId) =>
  String(movie?.channelId || '') === String(channelId || '');

const ChanelSearchTavsiya = ({ channelId, onOpen }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { getMovieByIdLocal, moviesLoading } = useMoviesApi();
  const { items, isLoading } = useChannelHomeFeed({
    channelId,
    enabled: Boolean(channelId),
  });

  const recommendations = useMemo(
    () =>
      (items || [])
        .map((item) => getMovieByIdLocal(item.movieId))
        .filter((movie) => sameChannel(movie, channelId)),
    [channelId, getMovieByIdLocal, items]
  );

  const waiting = (isLoading || moviesLoading) && recommendations.length === 0;
  if (!waiting && recommendations.length === 0) return null;

  const titleOf = (movie) => {
    if (movie?.title && typeof movie.title === 'object') {
      return movie.title[contentLang] || movie.title.uz || movie.title.ru || '';
    }
    return movie?.title || '';
  };

  const imageOf = (movie) => {
    if (movie?.homeImg && typeof movie.homeImg === 'object') {
      return movie.homeImg[contentLang] || movie.homeImg.uz || movie.homeImg.ru || '';
    }
    return movie?.homeImg || '';
  };

  const openMovie = (movie) => {
    if (movie?.id == null) return;
    onOpen?.();
    navigate(`/movie/${movie.id}`);
  };

  return (
    <div className="search-modal-tavsiya" aria-busy={waiting || undefined}>
      {waiting ? (
        <SkeletonLoader
          variant="search-modal-tavsiya-title"
          className="search-modal-tavsiya-title-skeleton"
        />
      ) : (
        <h3 className="search-modal-tavsiya-title">
          {t('searchModal.tavsiyaEtamiz', 'Tavsiya etamiz')}
        </h3>
      )}
      {recommendations.length > 0 ? (
        <div className="search-modal-tavsiya-list">
          {recommendations.map((movie) => (
            <SearchModalTavsiyaItem
              key={movie.id}
              movie={movie}
              title={titleOf(movie)}
              imgSrc={imageOf(movie)}
              onOpen={openMovie}
              t={t}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default ChanelSearchTavsiya;
