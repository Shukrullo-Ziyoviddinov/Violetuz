import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useLocation, useSearchParams } from 'react-router-dom';
import { getTopRatedMovies } from '../components/TopRatedContent/TopRatedContent';
import { useMoviesApi } from '../context/MoviesApiContext';
import { useAppSelector } from '../store/hooks';
import { selectIsLoggedIn, selectAuthReady, selectProfile } from '../store/slices/userSlice';
import {
  fetchViewerCategoryRecommendations,
  resolveRecommendationCategoryKey,
} from '../api/recommendationsApi';
import { getWatchHistory } from '../utils/localStorage/guestHistory/movieGuestHistory';
import { GUEST_MOVIE_HISTORY_CHANGED } from '../utils/localStorage/guestHistory/events';
import Filters from '../components/Filters';
import Movies from '../components/Movies/Movies';
import './RecommendedPage.css';

const getRatingFilter = (movie, selectedRatingType, selectedRating) => {
  if (selectedRating === null) return true;
  // Anonslar VL (rating) filteriga aralashmaydi - VL tanlanganda anonslar chiqmaydi, boshqa reytinglarda qatnashadi
  if (selectedRatingType === 'rating' && movie.category === 'anonslar') return false;
  const val = movie[selectedRatingType];
  return val != null && val !== '' && val !== 'none' && (val == selectedRating || Number(val) === Number(selectedRating));
};

const matchesFilterCategory = (movieCategory, filterCategory) => {
  if (filterCategory == null) return false;
  const values = Array.isArray(filterCategory) ? filterCategory : [filterCategory];
  return values.some((value) => String(movieCategory) === String(value));
};

const filterMoviesByNavCategory = (movies, categoryConfig) => {
  if (!categoryConfig) return movies;
  return movies.filter((movie) => matchesFilterCategory(movie.category, categoryConfig.filterCategory));
};

const getSimilarMovies = (currentMovie, movies) => {
  if (!currentMovie) return [];
  const currentTypeCategory = Array.isArray(currentMovie.typeCategory)
    ? currentMovie.typeCategory.map((tc) => String(tc).toLowerCase().trim())
    : currentMovie.typeCategory
    ? [String(currentMovie.typeCategory).toLowerCase().trim()]
    : [];
  const currentFilterCountry = currentMovie.filterCountry
    ? String(currentMovie.filterCountry).toLowerCase().trim()
    : '';
  return movies.filter((movie) => {
    if (movie.id === currentMovie.id) return false;
    if (!movie.typeCategory && !movie.filterCountry) return false;
    const movieTypeCategory = Array.isArray(movie.typeCategory)
      ? movie.typeCategory.map((tc) => String(tc).toLowerCase().trim())
      : movie.typeCategory
      ? [String(movie.typeCategory).toLowerCase().trim()]
      : [];
    const movieFilterCountry = movie.filterCountry
      ? String(movie.filterCountry).toLowerCase().trim()
      : '';
    const hasMatchingTypeCategory =
      currentTypeCategory.length > 0 &&
      movieTypeCategory.length > 0 &&
      currentTypeCategory.some((ctc) => movieTypeCategory.includes(ctc));
    const hasMatchingFilterCountry =
      currentFilterCountry &&
      movieFilterCountry &&
      currentFilterCountry === movieFilterCountry;
    return hasMatchingTypeCategory || hasMatchingFilterCountry;
  });
};

const RecommendedPage = () => {
  const { categoryId, movieId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const genreFromUrl = searchParams.get('genre');
  const { allMovies, allGenres, getCategoryById, moviesLoading, sections } = useMoviesApi();
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const profile = useAppSelector(selectProfile);

  const getGenresFromUrl = useCallback((g) => {
    if (!g) return [];
    const genreConfig = allGenres.find(
      (c) => c.filterGenre === g || (Array.isArray(c.filterGenre) && c.filterGenre.includes(g))
    );
    if (genreConfig) {
      return Array.isArray(genreConfig.filterGenre) ? [...genreConfig.filterGenre] : [genreConfig.filterGenre];
    }
    return [g];
  }, [allGenres]);

  const [selectedRatingType, setSelectedRatingType] = useState('rating');
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedAge, setSelectedAge] = useState(null);
  const [personalizedMovies, setPersonalizedMovies] = useState(null);
  // true by default — authReady oldin katalog flash yo‘q
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [guestHistoryEpoch, setGuestHistoryEpoch] = useState(0);

  useEffect(() => {
    const onHistory = () => setGuestHistoryEpoch((n) => n + 1);
    window.addEventListener(GUEST_MOVIE_HISTORY_CHANGED, onHistory);
    return () => window.removeEventListener(GUEST_MOVIE_HISTORY_CHANGED, onHistory);
  }, []);

  useEffect(() => {
    if (genreFromUrl) {
      setSelectedGenres(getGenresFromUrl(genreFromUrl));
    }
  }, [genreFromUrl, getGenresFromUrl]);

  const isSimilarMoviesPage = location.pathname.startsWith('/similar-movies/');

  // Genre filter bo'lsa (URL ?genre=) - barcha kinolardan qidirish (allMovies)
  const useAllMoviesForGenre = genreFromUrl && selectedGenres.length > 0;

  // Categories bar (/category/romantika va h.k.) - DB categories.filterCategory
  const navCategory = categoryId ? getCategoryById(categoryId) : null;
  const isNavCategory = Boolean(navCategory);

  const localCategoryMovies = useMemo(() => {
    if (isSimilarMoviesPage && movieId) {
      const currentMovie = allMovies.find((m) => String(m.id) === String(movieId));
      return getSimilarMovies(currentMovie, allMovies);
    }
    if (useAllMoviesForGenre) return allMovies;
    // /recommended — umumiy katalog (categoryName "movies" endi yo‘q)
    if (location.pathname === '/recommended') return allMovies;
    if (categoryId === 'topRated') return getTopRatedMovies(allMovies);
    if (isNavCategory) return filterMoviesByNavCategory(allMovies, navCategory);
    if (categoryId) {
      return allMovies.filter(
        (movie) =>
          movie.typeCategory?.includes(categoryId) ||
          movie.category === categoryId ||
          movie.categoryName === categoryId
      );
    }
    return allMovies;
  }, [
    allMovies,
    categoryId,
    isNavCategory,
    isSimilarMoviesPage,
    location.pathname,
    movieId,
    navCategory,
    useAllMoviesForGenre,
  ]);

  const sectionCategoryNames = useMemo(
    () =>
      (Array.isArray(sections) ? sections : [])
        .map((section) => section?.categoryName)
        .filter((name) => typeof name === 'string' && name.trim()),
    [sections]
  );

  const recommendationCategoryKey = useMemo(
    () =>
      resolveRecommendationCategoryKey({
        pathname: location.pathname,
        categoryId,
        sectionCategoryNames,
      }),
    [categoryId, location.pathname, sectionCategoryNames]
  );

  useEffect(() => {
    let cancelled = false;

    // Nav chip / similar — personalized API yo‘q
    if (!recommendationCategoryKey) {
      setPersonalizedMovies(null);
      setRecommendationsLoading(false);
      return undefined;
    }

    // authReady / movies / login profile — katalog flash emas
    if (!authReady || moviesLoading || (isLoggedIn && !profile?.id)) {
      setPersonalizedMovies(null);
      setRecommendationsLoading(true);
      return undefined;
    }

    // Kategoriya almashganda eski ro‘yxatni darhol tozalash
    setPersonalizedMovies(null);
    setRecommendationsLoading(true);
    fetchViewerCategoryRecommendations({
      isLoggedIn,
      category: recommendationCategoryKey,
      limit: 120,
      localHistory: isLoggedIn ? undefined : getWatchHistory(),
    })
      .then((result) => {
        if (cancelled) return;
        const movies = Array.isArray(result.movies) ? result.movies : [];
        setPersonalizedMovies(movies.length ? movies : null);
      })
      .catch(() => {
        if (!cancelled) setPersonalizedMovies(null);
      })
      .finally(() => {
        if (!cancelled) setRecommendationsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    authReady,
    isLoggedIn,
    profile?.id,
    recommendationCategoryKey,
    moviesLoading,
    guestHistoryEpoch,
  ]);

  // Fetch davomida / authReady oldin — eski personalized yo‘q, katalog flash yo‘q
  const showRecLoading =
    Boolean(recommendationCategoryKey) && recommendationsLoading;

  const categoryFiltered =
    personalizedMovies && personalizedMovies.length > 0
      ? personalizedMovies
      : showRecLoading
        ? []
        : localCategoryMovies;

  // VL faqat anonslar sahifasida yashiriladi; aralash kontentda VL ko'rinadi, lekin anonslar VL filteriga kirmaydi
  const hideVlFilter = categoryId === 'anonslar';

  useEffect(() => {
    if (hideVlFilter && selectedRatingType === 'rating') {
      setSelectedRatingType('ratingImdb');
      setSelectedRating(null);
    }
  }, [hideVlFilter]);

  let filteredMovies = categoryFiltered;
  if (selectedRating !== null) {
    filteredMovies = filteredMovies.filter(movie =>
      getRatingFilter(movie, selectedRatingType, selectedRating)
    );
  }
  if (selectedCountry !== null) {
    filteredMovies = filteredMovies.filter(movie => movie.filterCountry === selectedCountry);
  }
  if (selectedGenres.length > 0) {
    filteredMovies = filteredMovies.filter(movie =>
      (movie.filterGenre || []).some(g => selectedGenres.includes(g))
    );
  }
  if (selectedAge !== null) {
    filteredMovies = filteredMovies.filter(movie => movie.ageRestriction === selectedAge);
  }

  const listLoading = moviesLoading || recommendationsLoading;

  return (
    <div className="recommended-page">
      <Filters
        movies={categoryFiltered}
        hideVlFilter={hideVlFilter}
        selectedRatingType={selectedRatingType}
        selectedRating={selectedRating}
        onRatingTypeSelect={setSelectedRatingType}
        onRatingSelect={setSelectedRating}
        selectedCountry={selectedCountry}
        onCountrySelect={setSelectedCountry}
        selectedGenres={selectedGenres}
        onGenreSelect={setSelectedGenres}
        selectedAge={selectedAge}
        onAgeSelect={setSelectedAge}
        isLoading={listLoading}
      />
      <Movies
        sectionType="all"
        limit={null}
        filteredMovies={filteredMovies}
        hideHeader
        isLoading={listLoading}
      />
    </div>
  );
};

export default RecommendedPage;
