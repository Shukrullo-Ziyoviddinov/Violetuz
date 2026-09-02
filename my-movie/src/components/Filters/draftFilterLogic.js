/**
 * Shared draft filter logic — wishlist va like-history uchun umumiy.
 * Domain-specific tab/catalog logikasi shu faylda emas.
 */
import {
  applyDraftFilters as applyMovieDraftFilters,
  buildDraftOptions as buildMovieDraftOptions,
} from './FiltersMobileModal';

const norm = (v) => (typeof v === 'string' ? v.toLowerCase().trim() : v);

export const EMPTY_MOVIE_DRAFT = {
  ratingType: 'rating',
  rating: null,
  country: null,
  genres: [],
  age: null,
};

export const EMPTY_MUSIC_DRAFT = {
  year: null,
  genre: null,
  language: null,
  country: null,
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

export const buildMusicFilterOptions = (data, filters) => {
  const { year, genre, language, country } = filters || EMPTY_MUSIC_DRAFT;

  const forYearOpts = data
    .filter((item) => {
      if (genre && genre !== 'all' && norm(item.genre) !== norm(genre)) return false;
      if (language && language !== 'all' && norm(item.language) !== norm(language)) {
        return false;
      }
      if (country && country !== 'all' && norm(item.country) !== norm(country)) {
        return false;
      }
      return true;
    })
    .map((item) => Number(item.year))
    .filter((v) => !Number.isNaN(v));

  const forGenreOpts = data
    .filter((item) => {
      if (
        year != null &&
        year !== '' &&
        year !== 'all' &&
        Number(item.year) !== Number(year)
      ) {
        return false;
      }
      if (language && language !== 'all' && norm(item.language) !== norm(language)) {
        return false;
      }
      if (country && country !== 'all' && norm(item.country) !== norm(country)) {
        return false;
      }
      return true;
    })
    .map((item) => (item.genre || '').trim())
    .filter(Boolean);

  const forLangOpts = data
    .filter((item) => {
      if (
        year != null &&
        year !== '' &&
        year !== 'all' &&
        Number(item.year) !== Number(year)
      ) {
        return false;
      }
      if (genre && genre !== 'all' && norm(item.genre) !== norm(genre)) return false;
      if (country && country !== 'all' && norm(item.country) !== norm(country)) {
        return false;
      }
      return true;
    })
    .map((item) => (item.language || '').trim())
    .filter(Boolean);

  const forCountryOpts = data
    .filter((item) => {
      if (
        year != null &&
        year !== '' &&
        year !== 'all' &&
        Number(item.year) !== Number(year)
      ) {
        return false;
      }
      if (genre && genre !== 'all' && norm(item.genre) !== norm(genre)) return false;
      if (language && language !== 'all' && norm(item.language) !== norm(language)) {
        return false;
      }
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

export const applyMusicDraftFilters = (data, filters) => {
  const { year, genre, language, country } = filters || EMPTY_MUSIC_DRAFT;
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

export { applyMovieDraftFilters, buildMovieDraftOptions };
