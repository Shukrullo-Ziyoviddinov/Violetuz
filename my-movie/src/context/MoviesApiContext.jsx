import React, { createContext, useContext, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAllMovies, fetchMovieById, fetchMovieSections, fetchHomeContent } from '../api/moviesApi';
import { fetchAllBanners } from '../api/bannersApi';
import { fetchAllGenres } from '../api/genresApi';
import { fetchAllCategories } from '../api/categoriesApi';
import { fetchAllAds } from '../api/adsApi';
import { fetchAllShorts } from '../api/shortsApi';
import { fetchSiteLinks } from '../api/siteLinksApi';
import { fetchAllVideoBanners } from '../api/videoBannersApi';
import { resolveShortsWithMovies } from '../utils/resolveShortsWithMovies';

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
  const genresQuery = useQuery({
    queryKey: ['genres'],
    queryFn: fetchAllGenres,
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: fetchAllCategories,
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const adsQuery = useQuery({
    queryKey: ['ads'],
    queryFn: fetchAllAds,
    staleTime: 60_000,
    retry: 1,
  });
  const shortsQuery = useQuery({
    queryKey: ['shorts'],
    queryFn: fetchAllShorts,
    staleTime: 60_000,
    retry: 1,
  });
  const siteLinksQuery = useQuery({
    queryKey: ['site-links'],
    queryFn: fetchSiteLinks,
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const videoBannersQuery = useQuery({
    queryKey: ['video-banners'],
    queryFn: fetchAllVideoBanners,
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
  const allGenres = useMemo(
    () => (Array.isArray(genresQuery.data) ? genresQuery.data : []),
    [genresQuery.data]
  );
  const allCategories = useMemo(
    () => (Array.isArray(categoriesQuery.data) ? categoriesQuery.data : []),
    [categoriesQuery.data]
  );
  const allAds = useMemo(
    () => (Array.isArray(adsQuery.data) ? adsQuery.data : []),
    [adsQuery.data]
  );
  const allShortsVideos = useMemo(
    () => (Array.isArray(shortsQuery.data) ? shortsQuery.data : []),
    [shortsQuery.data]
  );
  const movieShortsCatalog = useMemo(
    () => resolveShortsWithMovies(allShortsVideos, allMovies),
    [allShortsVideos, allMovies]
  );
  const siteLinks = useMemo(
    () =>
      siteLinksQuery.data && typeof siteLinksQuery.data === 'object'
        ? siteLinksQuery.data
        : { id: 'site', contact: {}, socialLinks: {}, appStoreLinks: {} },
    [siteLinksQuery.data]
  );
  const contactData = useMemo(() => siteLinks.contact || {}, [siteLinks]);
  const socialLinks = useMemo(() => siteLinks.socialLinks || {}, [siteLinks]);
  const appStoreLinks = useMemo(() => siteLinks.appStoreLinks || {}, [siteLinks]);
  const allVideoBanners = useMemo(
    () => (Array.isArray(videoBannersQuery.data) ? videoBannersQuery.data : []),
    [videoBannersQuery.data]
  );
  const loading =
    moviesQuery.isLoading ||
    sectionsQuery.isLoading ||
    homeContentQuery.isLoading ||
    bannersQuery.isLoading ||
    genresQuery.isLoading ||
    categoriesQuery.isLoading ||
    adsQuery.isLoading ||
    shortsQuery.isLoading ||
    siteLinksQuery.isLoading ||
    videoBannersQuery.isLoading;
  const bannersLoading = moviesQuery.isLoading || bannersQuery.isLoading;
  const error =
    moviesQuery.error?.message ||
    sectionsQuery.error?.message ||
    homeContentQuery.error?.message ||
    bannersQuery.error?.message ||
    genresQuery.error?.message ||
    categoriesQuery.error?.message ||
    adsQuery.error?.message ||
    shortsQuery.error?.message ||
    siteLinksQuery.error?.message ||
    videoBannersQuery.error?.message ||
    null;

  const value = useMemo(() => ({
    allMovies,
    sections,
    homeContent,
    allBanners,
    allGenres,
    allCategories,
    allAds,
    allShortsVideos,
    movieShortsCatalog,
    siteLinks,
    contactData,
    socialLinks,
    appStoreLinks,
    allVideoBanners,
    loading,
    bannersLoading,
    error,
    getMoviesByCategory: (categoryName) => allMovies.filter((m) => m.categoryName === categoryName),
    getBannersByLang: (lang) => allBanners.filter((b) => b.lang === lang),
    getVideoBannersByType: (type) =>
      type ? allVideoBanners.filter((b) => b.type === type) : allVideoBanners,
    getGenreById: (id) => allGenres.find((g) => g.id === id) || null,
    getCategoryById: (id) => allCategories.find((c) => String(c.id) === String(id)) || null,
    getActiveAd: () => allAds.find((ad) => ad.isActive) || allAds[0] || null,
    getShortByIdLocal: (id) =>
      movieShortsCatalog.find((s) => String(s.id) === String(id)) || null,
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
    refreshGenres: async () => {
      const genres = await queryClient.fetchQuery({
        queryKey: ['genres'],
        queryFn: fetchAllGenres,
      });
      return genres;
    },
    refreshCategories: async () => {
      const categories = await queryClient.fetchQuery({
        queryKey: ['categories'],
        queryFn: fetchAllCategories,
      });
      return categories;
    },
    refreshAds: async () => {
      const ads = await queryClient.fetchQuery({
        queryKey: ['ads'],
        queryFn: fetchAllAds,
      });
      return ads;
    },
    refreshShorts: async () => {
      const shorts = await queryClient.fetchQuery({
        queryKey: ['shorts'],
        queryFn: fetchAllShorts,
      });
      return shorts;
    },
    refreshSiteLinks: async () => {
      const links = await queryClient.fetchQuery({
        queryKey: ['site-links'],
        queryFn: fetchSiteLinks,
      });
      return links;
    },
    refreshVideoBanners: async () => {
      const videoBanners = await queryClient.fetchQuery({
        queryKey: ['video-banners'],
        queryFn: fetchAllVideoBanners,
      });
      return videoBanners;
    },
    fetchMovieByIdRemote: fetchMovieById,
  }), [
    allMovies,
    sections,
    homeContent,
    allBanners,
    allGenres,
    allCategories,
    allAds,
    allShortsVideos,
    movieShortsCatalog,
    siteLinks,
    contactData,
    socialLinks,
    appStoreLinks,
    allVideoBanners,
    loading,
    bannersLoading,
    error,
    queryClient,
  ]);

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
