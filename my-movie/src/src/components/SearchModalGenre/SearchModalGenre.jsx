import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import { genres } from '../../data/genres';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import './SearchModalGenre.css';

const SearchModalGenre = ({ onGenreClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();

  const getGenreTitle = (genre) => {
    if (genre.title && typeof genre.title === 'object') {
      return genre.title[contentLang] || genre.title.uz || genre.title.ru;
    }
    return genre.title || '';
  };

  const handleGenreClick = (genre) => {
    if (onGenreClick) {
      onGenreClick();
    }
    const filterValue = Array.isArray(genre.filterGenre) ? genre.filterGenre[0] : genre.filterGenre;
    navigate(`/recommended?genre=${encodeURIComponent(filterValue)}`);
  };

  return (
    <div className="search-modal-genre">
      <h3 className="search-modal-genre-title">{t('filters.genre', 'Janr')}</h3>
      <HorizontalScroll scrollAmount={320}>
        {genres.map((genre) => (
          <div
            key={genre.id}
            className="search-modal-genre-item"
            onClick={() => handleGenreClick(genre)}
          >
            <div className="search-modal-genre-item-image-wrapper">
              <img
                src={genre.img}
                alt={getGenreTitle(genre)}
                className="search-modal-genre-item-image"
              />
              <span className="search-modal-genre-item-title">{getGenreTitle(genre)}</span>
            </div>
          </div>
        ))}
      </HorizontalScroll>
    </div>
  );
};

export default SearchModalGenre;
