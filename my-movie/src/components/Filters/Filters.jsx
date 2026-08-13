import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FilterReyting from './FilterReyting';
import FilterCountry from './FilterCountry';
import FilterGenre from './FilterGenre';
import FilterAge from './FilterAge';
import FiltersMobileModal, { applyDraftFilters } from './FiltersMobileModal';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import { useIsMobileFilter } from './useIsMobileFilter';
import './FilterReyting.css';
import './FilterCountry.css';
import './FilterGenre.css';
import './FilterAge.css';
import './FiltersSelect.css';
import './FiltersMobile.css';

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

const makeDraft = ({
  selectedRatingType,
  selectedRating,
  selectedCountry,
  selectedGenres,
  selectedAge,
  hideVlFilter,
}) => ({
  ratingType:
    hideVlFilter && selectedRatingType === 'rating'
      ? 'ratingImdb'
      : selectedRatingType || 'rating',
  rating: selectedRating,
  country: selectedCountry,
  genres: Array.isArray(selectedGenres) ? [...selectedGenres] : [],
  age: selectedAge,
});

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
  const { t } = useTranslation();
  const isMobile = useIsMobileFilter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draft, setDraft] = useState(() =>
    makeDraft({
      selectedRatingType,
      selectedRating,
      selectedCountry,
      selectedGenres,
      selectedAge,
      hideVlFilter,
    })
  );

  const hasAnyFilter =
    selectedRating != null ||
    selectedCountry != null ||
    (selectedGenres && selectedGenres.length > 0) ||
    selectedAge != null;

  const draftResultCount = useMemo(
    () => applyDraftFilters(movies, draft, hideVlFilter).length,
    [movies, draft, hideVlFilter]
  );

  const openMobileModal = () => {
    setDraft(
      makeDraft({
        selectedRatingType,
        selectedRating,
        selectedCountry,
        selectedGenres,
        selectedAge,
        hideVlFilter,
      })
    );
    setMobileOpen(true);
  };

  const handleDraftClear = () => {
    setDraft({
      ratingType: hideVlFilter ? 'ratingImdb' : 'rating',
      rating: null,
      country: null,
      genres: [],
      age: null,
    });
  };

  const handleDraftApply = () => {
    onRatingTypeSelect?.(draft.ratingType);
    onRatingSelect?.(draft.rating);
    onCountrySelect?.(draft.country);
    onGenreSelect?.(draft.genres || []);
    onAgeSelect?.(draft.age);
    setMobileOpen(false);
  };

  if (isLoading) {
    return (
      <div className="filters filters--skeleton" aria-busy="true">
        <div className="filters-desktop">
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
        <div
          className="filters-mobile-bar filters-mobile-bar--skeleton"
          aria-hidden="true"
        >
          <span className="filters-mobile-bar-text">
            {t('music.searchAndFilter', 'Qidirish va filterlash')}
          </span>
        </div>
      </div>
    );
  }

  const moviesForRating = selectedCountry
    ? movies.filter((m) => m.filterCountry === selectedCountry)
    : movies;
  const moviesForCountry =
    selectedRating !== null
      ? movies.filter((m) =>
          getRatingFilter(m, selectedRatingType, selectedRating)
        )
      : movies;
  const moviesForGenre = (() => {
    let m =
      selectedRating !== null
        ? movies.filter((movie) =>
            getRatingFilter(movie, selectedRatingType, selectedRating)
          )
        : movies;
    m = selectedCountry
      ? m.filter((movie) => movie.filterCountry === selectedCountry)
      : m;
    return m;
  })();
  const moviesForAge = (() => {
    let m =
      selectedRating !== null
        ? movies.filter((movie) =>
            getRatingFilter(movie, selectedRatingType, selectedRating)
          )
        : movies;
    m = selectedCountry
      ? m.filter((movie) => movie.filterCountry === selectedCountry)
      : m;
    m =
      selectedGenres.length > 0
        ? m.filter((movie) =>
            (movie.filterGenre || []).some((g) => selectedGenres.includes(g))
          )
        : m;
    return m;
  })();

  return (
    <div className={`filters${hasAnyFilter ? ' has-active-filters' : ''}`}>
      {/* Desktop: alohida chip + modal */}
      <div className="filters-desktop">
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

      {/* Mobile: bitta bar → yagona modal */}
      <button
        type="button"
        className={`filters-mobile-bar${hasAnyFilter ? ' has-value' : ''}`}
        onClick={openMobileModal}
      >
        <span className="filters-mobile-bar-icon" aria-hidden="true">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 5h16" />
            <path d="M7 12h10" />
            <path d="M10 19h4" />
          </svg>
        </span>
        <span className="filters-mobile-bar-text">
          {t('music.searchAndFilter', 'Qidirish va filterlash')}
        </span>
        {hasAnyFilter ? (
          <span className="filters-mobile-bar-badge" aria-hidden="true" />
        ) : null}
      </button>

      {isMobile ? (
        <FiltersMobileModal
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          movies={movies}
          draft={draft}
          onDraftChange={setDraft}
          hideVlFilter={hideVlFilter}
          onClear={handleDraftClear}
          onApply={handleDraftApply}
          resultCount={draftResultCount}
        />
      ) : null}
    </div>
  );
};

export default Filters;
