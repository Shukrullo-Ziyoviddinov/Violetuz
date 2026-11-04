import React from 'react';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import SearchModalResultsMovieItem from '../SearchModalResults/SearchModalResultsMovieItem';
import '../SearchModalResults/SearchModalResults.css';

const movieTitle = (movie, lang) => {
  const title = movie?.title;
  if (title && typeof title === 'object') {
    return title[lang] || title.uz || title.ru || '';
  }
  return String(title || '').trim();
};

const movieImg = (movie, lang) => {
  if (movie?.homeImg && typeof movie.homeImg === 'object') {
    return movie.homeImg[lang] || movie.homeImg.uz || movie.homeImg.ru || '';
  }
  return movie?.homeImg || '';
};

const movieMeta = (movie) => {
  const year = movie?.specs?.year;
  const countries = Array.isArray(movie?.specs?.countries)
    ? movie.specs.countries.filter(Boolean).join(', ')
    : '';
  const parts = [];
  if (year != null && year !== '') parts.push(`${year}-yil`);
  if (countries) parts.push(countries);
  return parts.join(' ');
};

const ChanelSearchMovieResults = ({ movies, onOpen }) => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const list = Array.isArray(movies) ? movies : [];
  if (!list.length) return null;

  return (
    <div className="search-modal-results-movies-block">
      <h3 className="search-modal-results-section-title">
        {t('searchModal.moviesSection', 'Kinolar')}
      </h3>
      <div className="search-modal-results-grid">
        {list.map((movie) => (
          <SearchModalResultsMovieItem
            key={`channel-movie-${movie.id}`}
            imgSrc={movieImg(movie, contentLang)}
            title={movieTitle(movie, contentLang)}
            metaText={movieMeta(movie)}
            isSoon={movie.category === 'anonslar'}
            ageRestriction={movie.ageRestriction}
            soonLabel={t('searchModal.tezOrada', 'Tez orada')}
            onClick={() => onOpen?.(movie)}
          />
        ))}
      </div>
    </div>
  );
};

export default ChanelSearchMovieResults;
