import React from 'react';
import { useTranslation } from 'react-i18next';
import { allMovies } from '../../data/movies';
import Movies from '../Movies/Movies';
import { DEFAULT_LIMIT } from '../ShowMoreButton/ShowMoreButton';

const MIN_RATING = 5;

export const getTopRatedMovies = (movies) => {
  const toNum = (v) => (v != null && v !== '' && v !== 'none' ? Number(v) : 0);
  return [...movies]
    .filter((m) => {
      const imdb = toNum(m.ratingImdb);
      const kp = toNum(m.ratingKinopoisk);
      const netflix = toNum(m.ratingNetflix);
      return imdb > MIN_RATING || kp > MIN_RATING || netflix > MIN_RATING;
    })
    .sort((a, b) => {
      const maxA = Math.max(toNum(a.ratingImdb), toNum(a.ratingKinopoisk), toNum(a.ratingNetflix));
      const maxB = Math.max(toNum(b.ratingImdb), toNum(b.ratingKinopoisk), toNum(b.ratingNetflix));
      return maxB - maxA;
    });
};

const TopRatedContent = ({ limit = DEFAULT_LIMIT, showHorizontalScroll = true, moreTo = '/category/topRated' }) => {
  const { t } = useTranslation();
  const topRatedMovies = React.useMemo(() => getTopRatedMovies(allMovies), []);

  return (
    <Movies
      sectionType="topRated"
      filteredMovies={topRatedMovies}
      limit={limit}
      showHorizontalScroll={showHorizontalScroll}
      headerTitle={t('movies.topRated')}
      moreTo={moreTo}
    />
  );
};

export default TopRatedContent;
