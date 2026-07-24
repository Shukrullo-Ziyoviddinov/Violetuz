import React from 'react';
import FilterReyting from './FilterReyting';
import FilterCountry from './FilterCountry';
import FilterGenre from './FilterGenre';
import FilterAge from './FilterAge';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import './FilterReyting.css';
import './FilterCountry.css';
import './FilterGenre.css';
import './FilterAge.css';

const getRatingFilter = (movie, selectedRatingType, selectedRating) => {
  if (selectedRating === null) return true;
  const val = movie[selectedRatingType];
  return val != null && val !== '' && val !== 'none' && (val == selectedRating || Number(val) === Number(selectedRating));
};

const FILTER_BTN_SKELETONS = [
  'filters-btn--skeleton-rating',
  'filters-btn--skeleton-country',
  'filters-btn--skeleton-genre',
  'filters-btn--skeleton-age',
];

const Filters = ({
  movies = [],
  selectedRatingType = 'rating',
  selectedRating,
  onRatingTypeSelect,
  onRatingSelect,
  selectedCountry,
  onCountrySelect,
  selectedGenres = [],
  onGenreSelect,
  selectedAge = null,
  onAgeSelect,
  hideVlFilter = false,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="filters filters--skeleton" aria-busy="true">
        <div className="filters-container">
          <ScrollTouch className="filters-scroll">
            <div className="filters-row">
              {FILTER_BTN_SKELETONS.map((mod) => (
                <span
                  key={mod}
                  className={`filters-btn filters-btn--skeleton ${mod}`}
                  aria-hidden="true"
                />
              ))}
            </div>
          </ScrollTouch>
        </div>
      </div>
    );
  }

  const moviesForRating = selectedCountry
    ? movies.filter(m => m.filterCountry === selectedCountry)
    : movies;
  const moviesForCountry = selectedRating !== null
    ? movies.filter(m => getRatingFilter(m, selectedRatingType, selectedRating))
    : movies;
  const moviesForGenre = (() => {
    let m = selectedRating !== null
      ? movies.filter(movie => getRatingFilter(movie, selectedRatingType, selectedRating))
      : movies;
    m = selectedCountry ? m.filter(movie => movie.filterCountry === selectedCountry) : m;
    return m;
  })();
  const moviesForAge = (() => {
    let m = selectedRating !== null
      ? movies.filter(movie => getRatingFilter(movie, selectedRatingType, selectedRating))
      : movies;
    m = selectedCountry ? m.filter(movie => movie.filterCountry === selectedCountry) : m;
    m = selectedGenres.length > 0
      ? m.filter(movie => (movie.filterGenre || []).some(g => selectedGenres.includes(g)))
      : m;
    return m;
  })();

  return (
    <div className="filters">
      <div className="filters-container">
        <ScrollTouch className="filters-scroll">
        <div className="filters-row">
        <FilterReyting
          movies={moviesForRating}
          selectedRatingType={selectedRatingType}
          selectedRating={selectedRating}
          onRatingTypeSelect={onRatingTypeSelect}
          onRatingSelect={onRatingSelect}
          hideVlFilter={hideVlFilter}
        />
        <FilterCountry
          movies={moviesForCountry}
          selectedCountry={selectedCountry}
          onCountrySelect={onCountrySelect}
        />
        <FilterGenre
          movies={moviesForGenre}
          selectedGenres={selectedGenres}
          onGenreSelect={onGenreSelect}
        />
        <FilterAge
          movies={moviesForAge}
          selectedAge={selectedAge}
          onAgeSelect={onAgeSelect}
        />
        </div>
        </ScrollTouch>
      </div>
    </div>
  );
};

export default Filters;
