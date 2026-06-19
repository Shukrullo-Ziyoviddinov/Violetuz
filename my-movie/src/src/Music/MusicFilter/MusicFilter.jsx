import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ScrollTouch from '../../components/ScrollTouch/ScrollTouch';
import MusicFilterModal from './MusicFilterModal';
import './MusicFilter.css';

const norm = (v) => (typeof v === 'string' ? v.toLowerCase().trim() : v);

const MusicFilter = ({ data = [], onFilteredChange }) => {
  const { t } = useTranslation();

  const LABELS = {
    year: t('music.filterYear'),
    genre: t('music.filterGenre'),
    language: t('music.filterLanguage'),
    country: t('music.filterCountry'),
  };
  const [filters, setFilters] = useState({
    year: null,
    genre: null,
    language: null,
    country: null,
  });
  const [modalType, setModalType] = useState(null);
  const { year, genre, language, country } = filters;

  const hasAnyFilter = year != null || (genre && genre !== 'all') || (language && language !== 'all') || (country && country !== 'all');
  const isBarchasiActive = !hasAnyFilter;

  const { filteredData, yearOpts, genreOpts, languageOpts, countryOpts } = useMemo(() => {
    const base = data;

    const byYear = year != null && year !== '' && year !== 'all'
      ? base.filter((item) => Number(item.year) === Number(year))
      : base;
    const byGenre = genre && genre !== 'all'
      ? byYear.filter((item) => norm(item.genre) === norm(genre))
      : byYear;
    const byLang = language && language !== 'all'
      ? byGenre.filter((item) => norm(item.language) === norm(language))
      : byGenre;
    const byCountry = country && country !== 'all'
      ? byLang.filter((item) => norm(item.country) === norm(country))
      : byLang;

    const finalFiltered = byCountry;

    const forYearOpts = data
      .filter((item) => {
        if (genre && genre !== 'all' && norm(item.genre) !== norm(genre)) return false;
        if (language && language !== 'all' && norm(item.language) !== norm(language)) return false;
        if (country && country !== 'all' && norm(item.country) !== norm(country)) return false;
        return true;
      })
      .map((item) => Number(item.year))
      .filter((v) => !isNaN(v));
    const forGenreOpts = data
      .filter((item) => {
        if (year != null && year !== '' && year !== 'all' && Number(item.year) !== Number(year)) return false;
        if (language && language !== 'all' && norm(item.language) !== norm(language)) return false;
        if (country && country !== 'all' && norm(item.country) !== norm(country)) return false;
        return true;
      })
      .map((item) => (item.genre || '').trim())
      .filter(Boolean);
    const forLangOpts = data
      .filter((item) => {
        if (year != null && year !== '' && year !== 'all' && Number(item.year) !== Number(year)) return false;
        if (genre && genre !== 'all' && norm(item.genre) !== norm(genre)) return false;
        if (country && country !== 'all' && norm(item.country) !== norm(country)) return false;
        return true;
      })
      .map((item) => (item.language || '').trim())
      .filter(Boolean);
    const forCountryOpts = data
      .filter((item) => {
        if (year != null && year !== '' && year !== 'all' && Number(item.year) !== Number(year)) return false;
        if (genre && genre !== 'all' && norm(item.genre) !== norm(genre)) return false;
        if (language && language !== 'all' && norm(item.language) !== norm(language)) return false;
        return true;
      })
      .map((item) => (item.country || '').trim())
      .filter(Boolean);

    const uniqueYear = [...new Set(forYearOpts)].sort((a, b) => a - b);
    const uniqueStr = (arr) => {
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

    return {
      filteredData: finalFiltered,
      yearOpts: uniqueYear,
      genreOpts: uniqueStr(forGenreOpts),
      languageOpts: uniqueStr(forLangOpts),
      countryOpts: uniqueStr(forCountryOpts),
    };
  }, [data, year, genre, language, country]);

  useEffect(() => {
    onFilteredChange?.(filteredData);
  }, [filteredData, onFilteredChange]);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      year: null,
      genre: null,
      language: null,
      country: null,
    });
  };

  const getModalConfig = () => {
    if (!modalType) return null;
    const configs = {
      year: {
        title: LABELS.year,
        options: yearOpts,
        value: year,
        onChange: (v) => setFilter('year', v),
      },
      genre: {
        title: LABELS.genre,
        options: genreOpts,
        value: genre,
        onChange: (v) => setFilter('genre', v),
      },
      language: {
        title: LABELS.language,
        options: languageOpts,
        value: language,
        onChange: (v) => setFilter('language', v),
      },
      country: {
        title: LABELS.country,
        options: countryOpts,
        value: country,
        onChange: (v) => setFilter('country', v),
      },
    };
    return configs[modalType];
  };

  const getFilterDisplayValue = (key) => {
    const v = filters[key];
    if (v == null || v === '' || v === 'all') return LABELS[key];
    return String(v);
  };

  const modalConfig = getModalConfig();

  return (
    <div className="music-filter">
      <ScrollTouch className="music-filter-scroll">
        <button
          type="button"
          className={`music-filter-btn music-filter-btn-barchasi ${isBarchasiActive ? 'active' : ''}`}
          onClick={clearAllFilters}
        >
          <span className="music-filter-value">{t('music.filterAll')}</span>
        </button>
        <button
          type="button"
          className={`music-filter-btn ${modalType === 'year' ? 'open' : ''} ${year ? 'has-value' : ''}`}
          onClick={() => setModalType((t) => (t === 'year' ? null : 'year'))}
        >
          <span className="music-filter-label">{LABELS.year}:</span>
          <span className="music-filter-value">{getFilterDisplayValue('year')}</span>
          <svg className="music-filter-arrow" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>
        <button
          type="button"
          className={`music-filter-btn ${modalType === 'genre' ? 'open' : ''} ${genre ? 'has-value' : ''}`}
          onClick={() => setModalType((t) => (t === 'genre' ? null : 'genre'))}
        >
          <span className="music-filter-label">{LABELS.genre}:</span>
          <span className="music-filter-value">{getFilterDisplayValue('genre')}</span>
          <svg className="music-filter-arrow" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>
        <button
          type="button"
          className={`music-filter-btn ${modalType === 'language' ? 'open' : ''} ${language ? 'has-value' : ''}`}
          onClick={() => setModalType((t) => (t === 'language' ? null : 'language'))}
        >
          <span className="music-filter-label">{LABELS.language}:</span>
          <span className="music-filter-value">{getFilterDisplayValue('language')}</span>
          <svg className="music-filter-arrow" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>
        <button
          type="button"
          className={`music-filter-btn ${modalType === 'country' ? 'open' : ''} ${country ? 'has-value' : ''}`}
          onClick={() => setModalType((t) => (t === 'country' ? null : 'country'))}
        >
          <span className="music-filter-label">{LABELS.country}:</span>
          <span className="music-filter-value">{getFilterDisplayValue('country')}</span>
          <svg className="music-filter-arrow" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>
      </ScrollTouch>

      {modalConfig && (
        <MusicFilterModal
          isOpen={!!modalType}
          onClose={() => setModalType(null)}
          modalType={modalType}
          title={modalConfig.title}
          options={modalConfig.options}
          value={modalConfig.value}
          onChange={(v) => {
            modalConfig.onChange(v);
            setModalType(null);
          }}
        />
      )}
    </div>
  );
};

export default MusicFilter;
