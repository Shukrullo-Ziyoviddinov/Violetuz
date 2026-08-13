import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ScrollTouch from '../../components/ScrollTouch/ScrollTouch';
import MusicFilterModal from './MusicFilterModal';
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';
import './MusicFilter.css';

const norm = (v) => (typeof v === 'string' ? v.toLowerCase().trim() : v);
const MOBILE_MAX = 767;
const EMPTY_FILTERS = { year: null, genre: null, language: null, country: null };
const FILTER_SKELETON_KEYS = ['year', 'genre', 'language', 'country'];

const applyFilters = (data, { year, genre, language, country }) => {
  let list = data;
  if (year != null && year !== '' && year !== 'all') {
    list = list.filter((item) => Number(item.year) === Number(year));
  }
  if (genre && genre !== 'all') {
    list = list.filter((item) => norm(item.genre) === norm(genre));
  }
  if (language && language !== 'all') {
    list = list.filter((item) => norm(item.language) === norm(language));
  }
  if (country && country !== 'all') {
    list = list.filter((item) => norm(item.country) === norm(country));
  }
  return list;
};

const uniqueSortedStrings = (arr) => {
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    const key = norm(v);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }
  return out.sort((a, b) => String(a).localeCompare(String(b)));
};

const buildFilterOptions = (data, filters) => {
  const { year, genre, language, country } = filters;

  const forYearOpts = data
    .filter((item) => {
      if (genre && genre !== 'all' && norm(item.genre) !== norm(genre)) return false;
      if (language && language !== 'all' && norm(item.language) !== norm(language)) return false;
      if (country && country !== 'all' && norm(item.country) !== norm(country)) return false;
      return true;
    })
    .map((item) => Number(item.year))
    .filter((v) => !Number.isNaN(v));

  const forGenreOpts = data
    .filter((item) => {
      if (year != null && year !== '' && year !== 'all' && Number(item.year) !== Number(year)) {
        return false;
      }
      if (language && language !== 'all' && norm(item.language) !== norm(language)) return false;
      if (country && country !== 'all' && norm(item.country) !== norm(country)) return false;
      return true;
    })
    .map((item) => (item.genre || '').trim())
    .filter(Boolean);

  const forLangOpts = data
    .filter((item) => {
      if (year != null && year !== '' && year !== 'all' && Number(item.year) !== Number(year)) {
        return false;
      }
      if (genre && genre !== 'all' && norm(item.genre) !== norm(genre)) return false;
      if (country && country !== 'all' && norm(item.country) !== norm(country)) return false;
      return true;
    })
    .map((item) => (item.language || '').trim())
    .filter(Boolean);

  const forCountryOpts = data
    .filter((item) => {
      if (year != null && year !== '' && year !== 'all' && Number(item.year) !== Number(year)) {
        return false;
      }
      if (genre && genre !== 'all' && norm(item.genre) !== norm(genre)) return false;
      if (language && language !== 'all' && norm(item.language) !== norm(language)) return false;
      return true;
    })
    .map((item) => (item.country || '').trim())
    .filter(Boolean);

  return {
    yearOpts: [...new Set(forYearOpts)].sort((a, b) => a - b),
    genreOpts: uniqueSortedStrings(forGenreOpts),
    languageOpts: uniqueSortedStrings(forLangOpts),
    countryOpts: uniqueSortedStrings(forCountryOpts),
  };
};

const useIsMobileFilter = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_MAX);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return isMobile;
};

const MusicFilter = ({ data = [], onFilteredChange, forceSkeleton = false }) => {
  const { t } = useTranslation();
  const isMobile = useIsMobileFilter();

  const LABELS = {
    year: t('music.filterYear', 'Yil'),
    genre: t('music.filterGenre', 'Janr'),
    language: t('music.filterLanguage', 'Til'),
    country: t('music.filterCountry', 'Davlat'),
  };

  const [filters, setFilters] = useState(() => ({ ...EMPTY_FILTERS }));
  const [draftFilters, setDraftFilters] = useState(() => ({ ...EMPTY_FILTERS }));
  const [modalType, setModalType] = useState(null);
  const [mobileModalOpen, setMobileModalOpen] = useState(false);

  const { year, genre, language, country } = filters;

  const hasAnyFilter =
    year != null ||
    (genre && genre !== 'all') ||
    (language && language !== 'all') ||
    (country && country !== 'all');
  const isBarchasiActive = !hasAnyFilter;

  const filteredData = useMemo(
    () => applyFilters(data, filters),
    [data, filters]
  );

  const appliedOptions = useMemo(
    () => buildFilterOptions(data, filters),
    [data, filters]
  );

  const draftFilteredData = useMemo(
    () => applyFilters(data, draftFilters),
    [data, draftFilters]
  );

  const draftOptions = useMemo(
    () => buildFilterOptions(data, draftFilters),
    [data, draftFilters]
  );

  useEffect(() => {
    if (forceSkeleton) return;
    onFilteredChange?.(filteredData);
  }, [filteredData, onFilteredChange, forceSkeleton]);

  useEffect(() => {
    setFilters({ ...EMPTY_FILTERS });
    setDraftFilters({ ...EMPTY_FILTERS });
    setModalType(null);
    setMobileModalOpen(false);
  }, [data]);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({ ...EMPTY_FILTERS });
  };

  const openMobileModal = () => {
    setDraftFilters({ ...filters });
    setMobileModalOpen(true);
  };

  const handleDraftSelect = (key, value) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleDraftClear = () => {
    setDraftFilters({ ...EMPTY_FILTERS });
  };

  const handleDraftApply = () => {
    setFilters(draftFilters);
    setMobileModalOpen(false);
  };

  const getFilterDisplayValue = (key) => {
    const v = filters[key];
    if (v == null || v === '' || v === 'all') return LABELS[key];
    return String(v);
  };

  const singleModalConfig = modalType
    ? {
        year: {
          title: LABELS.year,
          options: appliedOptions.yearOpts,
          value: year,
          onChange: (v) => setFilter('year', v),
        },
        genre: {
          title: LABELS.genre,
          options: appliedOptions.genreOpts,
          value: genre,
          onChange: (v) => setFilter('genre', v),
        },
        language: {
          title: LABELS.language,
          options: appliedOptions.languageOpts,
          value: language,
          onChange: (v) => setFilter('language', v),
        },
        country: {
          title: LABELS.country,
          options: appliedOptions.countryOpts,
          value: country,
          onChange: (v) => setFilter('country', v),
        },
      }[modalType]
    : null;

  const mobileSections = [
    {
      key: 'year',
      title: LABELS.year,
      options: draftOptions.yearOpts,
      value: draftFilters.year,
    },
    {
      key: 'genre',
      title: LABELS.genre,
      options: draftOptions.genreOpts,
      value: draftFilters.genre,
    },
    {
      key: 'language',
      title: LABELS.language,
      options: draftOptions.languageOpts,
      value: draftFilters.language,
    },
    {
      key: 'country',
      title: LABELS.country,
      options: draftOptions.countryOpts,
      value: draftFilters.country,
    },
  ];

  if (forceSkeleton) {
    return (
      <div className="music-filter music-filter--skeleton" aria-busy="true" aria-hidden="true">
        <div className="music-filter-desktop">
          <div className="music-filter-scroll">
            <span className="music-filter-btn music-filter-btn-barchasi active music-filter-btn--skeleton">
              <SkeletonLoader variant="music-filter-value" />
            </span>
            {FILTER_SKELETON_KEYS.map((key) => (
              <span key={key} className="music-filter-btn music-filter-btn--skeleton">
                <SkeletonLoader variant="music-filter-label" />
                <SkeletonLoader variant="music-filter-value" />
              </span>
            ))}
          </div>
        </div>
        <div className="music-filter-mobile-bar music-filter-mobile-bar--skeleton">
          <SkeletonLoader variant="music-filter-value" />
        </div>
      </div>
    );
  }

  return (
    <div className={`music-filter${hasAnyFilter ? ' has-active-filters' : ''}`}>
      {/* Desktop: alohida chip tugmalar */}
      <div className="music-filter-desktop">
        <ScrollTouch className="music-filter-scroll">
          <button
            type="button"
            className={`music-filter-btn music-filter-btn-barchasi ${isBarchasiActive ? 'active' : ''}`}
            onClick={clearAllFilters}
          >
            <span className="music-filter-value">{t('music.filterAll', 'Barchasi')}</span>
          </button>
          {FILTER_SKELETON_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={`music-filter-btn ${modalType === key ? 'open' : ''} ${
                filters[key] ? 'has-value' : ''
              }`}
              onClick={() => setModalType((prev) => (prev === key ? null : key))}
            >
              <span className="music-filter-label">{LABELS[key]}:</span>
              <span className="music-filter-value">{getFilterDisplayValue(key)}</span>
              <svg className="music-filter-arrow" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>
          ))}
        </ScrollTouch>
      </div>

      {/* Mobile: navbar ustidagi bitta bar */}
      <button
        type="button"
        className={`music-filter-mobile-bar${hasAnyFilter ? ' has-value' : ''}`}
        onClick={openMobileModal}
      >
        <span className="music-filter-mobile-bar-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" strokeLinecap="round" />
            <path d="M4 5h6M4 12h4M4 19h8" strokeLinecap="round" />
          </svg>
        </span>
        <span className="music-filter-mobile-bar-text">
          {t('music.searchAndFilter', 'Qidirish va filterlash')}
        </span>
        {hasAnyFilter ? (
          <span className="music-filter-mobile-bar-badge" aria-hidden="true" />
        ) : null}
      </button>

      {!isMobile && singleModalConfig ? (
        <MusicFilterModal
          variant="single"
          isOpen={!!modalType}
          onClose={() => setModalType(null)}
          modalType={modalType}
          title={singleModalConfig.title}
          options={singleModalConfig.options}
          value={singleModalConfig.value}
          onChange={(v) => {
            singleModalConfig.onChange(v);
            setModalType(null);
          }}
        />
      ) : null}

      {isMobile ? (
        <MusicFilterModal
          variant="all"
          isOpen={mobileModalOpen}
          onClose={() => setMobileModalOpen(false)}
          sections={mobileSections}
          onSelect={handleDraftSelect}
          onClear={handleDraftClear}
          onApply={handleDraftApply}
          resultCount={draftFilteredData.length}
        />
      ) : null}
    </div>
  );
};

export default MusicFilter;
