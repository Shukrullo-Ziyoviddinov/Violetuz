import React, { createContext, useContext, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAllMovies, fetchMovieById, fetchMovieSections, fetchHomeContent } from '../api/moviesApi';
import { fetchAllBanners } from '../api/bannersApi';

const MoviesApiContext = createContext(null);

export const MoviesApiProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const moviesQuery = useQuery({
    queryKey: ['movies'],
    queryFn: fetchAllMovies,
    staleTime: 60_000,
    retry: 1,
  });
  const sectionsQuery = useQuery({
    queryKey: ['movie-sections'],
    queryFn: fetchMovieSections,
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const homeContentQuery = useQuery({
    queryKey: ['home-content'],
    queryFn: fetchHomeContent,
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const bannersQuery = useQuery({
    queryKey: ['banners'],
    queryFn: fetchAllBanners,
    staleTime: 60_000,
    retry: 1,
  });

  const allMovies = useMemo(
    () => (Array.isArray(moviesQuery.data) ? moviesQuery.data : []),
    [moviesQuery.data]
  );
  const sections = useMemo(
    () => (Array.isArray(sectionsQuery.data) ? sectionsQuery.data : []),
    [sectionsQuery.data]
  );
  const homeContent = useMemo(
    () => (Array.isArray(homeContentQuery.data) ? homeContentQuery.data : []),
    [homeContentQuery.data]
  );
  const allBanners = useMemo(
    () => (Array.isArray(bannersQuery.data) ? bannersQuery.data : []),
    [bannersQuery.data]
  );
  const loading =
    moviesQuery.isLoading ||
    sectionsQuery.isLoading ||
    homeContentQuery.isLoading ||
    bannersQuery.isLoading;
  const error =
    moviesQuery.error?.message ||
    sectionsQuery.error?.message ||
    homeContentQuery.error?.message ||
    bannersQuery.error?.message ||
    null;

  const value = useMemo(() => ({
    allMovies,
    sections,
    homeContent,
    allBanners,
    loading,
    error,
    getMoviesByCategory: (categoryName) => allMovies.filter((m) => m.categoryName === categoryName),
    getBannersByLang: (lang) => allBanners.filter((b) => b.lang === lang),
    getSectionById: (id) => sections.find((s) => s.id === id) || null,
    getMovieByIdLocal: (id) => allMovies.find((m) => String(m.id) === String(id)) || null,
    refreshMovies: async () => {
      const movies = await queryClient.fetchQuery({
        queryKey: ['movies'],
        queryFn: fetchAllMovies,
      });
      return movies;
    },
    refreshBanners: async () => {
      const banners = await queryClient.fetchQuery({
        queryKey: ['banners'],
        queryFn: fetchAllBanners,
      });
      return banners;
    },
    fetchMovieByIdRemote: fetchMovieById,
  }), [allMovies, sections, homeContent, allBanners, loading, error, queryClient]);

  return (
    <MoviesApiContext.Provider value={value}>
      {children}
    </MoviesApiContext.Provider>
  );
};

export const useMoviesApi = () => {
  const ctx = useContext(MoviesApiContext);
  if (!ctx) {
    throw new Error('useMoviesApi must be used within MoviesApiProvider');
  }
  return ctx;
};

export default MoviesApiContext;
