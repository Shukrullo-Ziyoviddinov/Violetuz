import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useViewedMovies } from '../../context/ViewedMoviesContext';
import { fetchRecommendations } from '../../api/recommendationsApi';
import './SearchModalTavsiya.css';

const SearchModalTavsiya = ({ onMovieClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { getViewedItems } = useViewedMovies();
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const viewedItems = getViewedItems();
    fetchRecommendations(viewedItems, 12).then(setRecommendations);
  }, [getViewedItems]);

  const getTitle = (m) => {
    if (m?.title && typeof m.title === 'object') {
      return m.title[contentLang] || m.title.uz || m.title.ru;
    }
    return m?.title || '';
  };

  const getImg = (m) => {
    if (m?.homeImg && typeof m.homeImg === 'object') {
      return m.homeImg[contentLang] || m.homeImg.uz || m.homeImg.ru;
    }
    return m?.homeImg || '';
  };

  const handleClick = (movie) => {
    if (onMovieClick) onMovieClick();
    navigate(`/movie/${movie.id}`);
  };

  if (recommendations.length === 0) return null;

  return (
    <div className="search-modal-tavsiya">
      <h3 className="search-modal-tavsiya-title">{t('searchModal.tavsiyaEtamiz', 'Tavsiya etamiz')}</h3>
      <div className="search-modal-tavsiya-list">
        {recommendations.map((movie) => (
          <div
            key={movie.id}
            className="search-modal-tavsiya-item"
            onClick={() => handleClick(movie)}
          >
            <div className="search-modal-tavsiya-item-image-wrapper">
              <img
                src={getImg(movie)}
                alt={getTitle(movie)}
                className="search-modal-tavsiya-item-image"
              />
              {movie.category === 'anonslar' ? (
                <span className="search-modal-tavsiya-badge search-modal-tavsiya-badge-soon">
                  {t('searchModal.tezOrada', 'Tez orada')}
                </span>
              ) : (
                <span className="search-modal-tavsiya-badge search-modal-tavsiya-badge-fhd">FHD</span>
              )}
              {movie.ageRestriction != null && (
                <span className="search-modal-tavsiya-badge search-modal-tavsiya-badge-age">
                  {movie.ageRestriction}+
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchModalTavsiya;
