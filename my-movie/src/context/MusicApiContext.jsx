import React, { createContext, useContext, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllMusic,
  fetchMusicById,
  fetchMusicSections,
  fetchMusicPageContent,
} from '../api/musicApi';
import { fetchAllAlbums, fetchAlbumById } from '../api/albumsApi';
import {
  fetchAllClips,
  fetchClipById,
  fetchClipSections,
} from '../api/clipsApi';
import {
  fetchAllConcerts,
  fetchConcertById,
  fetchConcertSections,
} from '../api/concertsApi';
import { fetchAllArtistMusicStories } from '../api/artistMusicStoriesApi';
import { fetchAllArtists } from '../api/artistsApi';
import { fetchAllMusicShorts } from '../api/musicShortsApi';
import { fetchAllMusicBanners } from '../api/musicBannersApi';
import { resolveMusicShortsCatalog } from '../utils/resolveMusicShortsCatalog';

const MusicApiContext = createContext(null);

export const MusicApiProvider = ({ children }) => {
  const queryClient = useQueryClient();

  const musicQuery = useQuery({
    queryKey: ['music'],
    queryFn: fetchAllMusic,
    staleTime: 60_000,
    retry: 1,
  });

  const albumsQuery = useQuery({
    queryKey: ['albums'],
    queryFn: fetchAllAlbums,
    staleTime: 60_000,
    retry: 1,
  });

  const clipsQuery = useQuery({
    queryKey: ['clips'],
    queryFn: fetchAllClips,
    staleTime: 60_000,
    retry: 1,
  });

  const concertsQuery = useQuery({
    queryKey: ['concerts'],
    queryFn: fetchAllConcerts,
    staleTime: 60_000,
    retry: 1,
  });

  const artistMusicStoriesQuery = useQuery({
    queryKey: ['artist-music-stories'],
    queryFn: fetchAllArtistMusicStories,
    staleTime: 60_000,
    retry: 1,
  });

  const artistsQuery = useQuery({
    queryKey: ['artists'],
    queryFn: fetchAllArtists,
    staleTime: 60_000,
    retry: 1,
  });
  const musicShortsQuery = useQuery({
    queryKey: ['music-shorts'],
    queryFn: fetchAllMusicShorts,
    staleTime: 60_000,
    retry: 1,
  });
  const musicBannersQuery = useQuery({
    queryKey: ['music-banners'],
    queryFn: fetchAllMusicBanners,
    staleTime: 60_000,
    retry: 1,
  });

  const sectionsQuery = useQuery({
    queryKey: ['music-sections'],
    queryFn: fetchMusicSections,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const clipSectionsQuery = useQuery({
    queryKey: ['clip-sections'],
    queryFn: fetchClipSections,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const concertSectionsQuery = useQuery({
    queryKey: ['concert-sections'],
    queryFn: fetchConcertSections,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const pageContentQuery = useQuery({
    queryKey: ['music-page-content'],
    queryFn: fetchMusicPageContent,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const allMusic = useMemo(
    () => (Array.isArray(musicQuery.data) ? musicQuery.data : []),
    [musicQuery.data]
  );
  const allAlbums = useMemo(
    () => (Array.isArray(albumsQuery.data) ? albumsQuery.data : []),
    [albumsQuery.data]
  );
  const allClips = useMemo(
    () => (Array.isArray(clipsQuery.data) ? clipsQuery.data : []),
    [clipsQuery.data]
  );
  const allConcerts = useMemo(
    () => (Array.isArray(concertsQuery.data) ? concertsQuery.data : []),
    [concertsQuery.data]
  );
  const allArtistMusicStories = useMemo(
    () => (Array.isArray(artistMusicStoriesQuery.data) ? artistMusicStoriesQuery.data : []),
    [artistMusicStoriesQuery.data]
  );
  const allArtists = useMemo(
    () => (Array.isArray(artistsQuery.data) ? artistsQuery.data : []),
    [artistsQuery.data]
  );
  const allMusicShorts = useMemo(
    () => (Array.isArray(musicShortsQuery.data) ? musicShortsQuery.data : []),
    [musicShortsQuery.data]
  );
  const musicShortsCatalog = useMemo(
    () =>
      resolveMusicShortsCatalog(allMusicShorts, allMusic, allClips, allConcerts, allArtists),
    [allMusicShorts, allMusic, allClips, allConcerts, allArtists]
  );
  const allMusicBanners = useMemo(
    () => (Array.isArray(musicBannersQuery.data) ? musicBannersQuery.data : []),
    [musicBannersQuery.data]
  );
  const sections = useMemo(
    () => (Array.isArray(sectionsQuery.data) ? sectionsQuery.data : []),
    [sectionsQuery.data]
  );
  const clipSections = useMemo(
    () => (Array.isArray(clipSectionsQuery.data) ? clipSectionsQuery.data : []),
    [clipSectionsQuery.data]
  );
  const concertSections = useMemo(
    () => (Array.isArray(concertSectionsQuery.data) ? concertSectionsQuery.data : []),
    [concertSectionsQuery.data]
  );
  const pageContent = useMemo(
    () => (Array.isArray(pageContentQuery.data) ? pageContentQuery.data : []),
    [pageContentQuery.data]
  );

  const loading =
    musicQuery.isPending ||
    albumsQuery.isPending ||
    clipsQuery.isPending ||
    concertsQuery.isPending ||
    artistMusicStoriesQuery.isPending ||
    artistsQuery.isPending ||
    musicShortsQuery.isPending ||
    musicBannersQuery.isPending ||
    sectionsQuery.isPending ||
    clipSectionsQuery.isPending ||
    concertSectionsQuery.isPending ||
    pageContentQuery.isPending;
  const musicShortsLoading = musicShortsQuery.isPending;
  const musicBannersLoading = musicBannersQuery.isPending;
  const musicLoading = musicQuery.isPending;
  const albumsLoading = albumsQuery.isPending;
  const clipsLoading = clipsQuery.isPending;
  const concertsLoading = concertsQuery.isPending;
  const sectionsLoading = sectionsQuery.isPending;
  const clipSectionsLoading = clipSectionsQuery.isPending;
  const concertSectionsLoading = concertSectionsQuery.isPending;
  const pageContentLoading = pageContentQuery.isPending;
  const error =
    musicQuery.error?.message ||
    albumsQuery.error?.message ||
    clipsQuery.error?.message ||
    concertsQuery.error?.message ||
    artistMusicStoriesQuery.error?.message ||
    artistsQuery.error?.message ||
    musicShortsQuery.error?.message ||
    musicBannersQuery.error?.message ||
    sectionsQuery.error?.message ||
    clipSectionsQuery.error?.message ||
    concertSectionsQuery.error?.message ||
    pageContentQuery.error?.message ||
    null;

  const value = useMemo(() => ({
    allMusic,
    allAlbums,
    allClips,
    allConcerts,
    allArtistMusicStories,
    allArtists,
    allMusicShorts,
    musicShortsCatalog,
    allMusicBanners,
    sections,
    clipSections,
    concertSections,
    pageContent,
    loading,
    musicShortsLoading,
    musicBannersLoading,
    musicLoading,
    albumsLoading,
    clipsLoading,
    concertsLoading,
    sectionsLoading,
    clipSectionsLoading,
    concertSectionsLoading,
    pageContentLoading,
    error,
    getMusicByCategory: (categoryNameMusic) =>
      allMusic.filter((item) => item.categoryNameMusic === categoryNameMusic),
    getAlbumsByCategory: (categoryNameMusic) =>
      allAlbums.filter((item) => item.categoryNameMusic === categoryNameMusic),
    getClipsByCategory: (categoryNameMusic) =>
      allClips.filter((item) => item.categoryNameMusic === categoryNameMusic),
    getConcertsByCategory: (categoryNameMusic) =>
      allConcerts.filter((item) => item.categoryNameMusic === categoryNameMusic),
    getSectionItems: (section) => {
      if (!section?.categoryNameMusic) return [];
      if (section.wishlistType === 'album') {
        return allAlbums.filter((item) => item.categoryNameMusic === section.categoryNameMusic);
      }
      if (section.wishlistType === 'klip') {
        return allClips.filter((item) => item.categoryNameMusic === section.categoryNameMusic);
      }
      if (section.wishlistType === 'konsert') {
        return allConcerts.filter((item) => item.categoryNameMusic === section.categoryNameMusic);
      }
      return allMusic.filter((item) => item.categoryNameMusic === section.categoryNameMusic);
    },
    getMusicByArtist: (artistId) =>
      allMusic.filter((item) => item.artistId === artistId),
    getAlbumsByArtist: (artistId) =>
      allAlbums.filter((item) => item.artistId === artistId),
    getClipsByArtist: (artistId) =>
      allClips.filter((item) => item.artistId === artistId),
    getConcertsByArtist: (artistId) =>
      allConcerts.filter((item) => item.artistId === artistId),
    getArtistMusicStoriesByArtist: (artistId) =>
      allArtistMusicStories.filter((item) => item.artistId === artistId),
    getMusicShortsByArtist: (artistId) =>
      musicShortsCatalog.filter((item) => item.artistId === artistId),
    getArtistById: (id) =>
      allArtists.find((item) => String(item.id) === String(id)) || null,
    getMusicShortByIdLocal: (id) =>
      musicShortsCatalog.find((item) => String(item.id) === String(id)) || null,
    getSectionById: (id) => sections.find((s) => s.id === id) || null,
    getClipSectionById: (id) => clipSections.find((s) => s.id === id) || null,
    getConcertSectionById: (id) => concertSections.find((s) => s.id === id) || null,
    getMusicByIdLocal: (id) =>
      allMusic.find((item) => String(item.id) === String(id)) || null,
    getAlbumByIdLocal: (id) =>
      allAlbums.find((item) => String(item.id) === String(id)) || null,
    getClipByIdLocal: (id) =>
      allClips.find((item) => String(item.id) === String(id)) || null,
    getConcertByIdLocal: (id) =>
      allConcerts.find((item) => String(item.id) === String(id)) || null,
    refreshMusic: async () => {
      const music = await queryClient.fetchQuery({
        queryKey: ['music'],
        queryFn: fetchAllMusic,
      });
      return music;
    },
    refreshAlbums: async () => {
      const albums = await queryClient.fetchQuery({
        queryKey: ['albums'],
        queryFn: fetchAllAlbums,
      });
      return albums;
    },
    refreshClips: async () => {
      const clips = await queryClient.fetchQuery({
        queryKey: ['clips'],
        queryFn: fetchAllClips,
      });
      return clips;
    },
    refreshConcerts: async () => {
      const concerts = await queryClient.fetchQuery({
        queryKey: ['concerts'],
        queryFn: fetchAllConcerts,
      });
      return concerts;
    },
    refreshArtistMusicStories: async () => {
      const stories = await queryClient.fetchQuery({
        queryKey: ['artist-music-stories'],
        queryFn: fetchAllArtistMusicStories,
      });
      return stories;
    },
    refreshArtists: async () => {
      const artists = await queryClient.fetchQuery({
        queryKey: ['artists'],
        queryFn: fetchAllArtists,
      });
      return artists;
    },
    refreshMusicShorts: async () => {
      const shorts = await queryClient.fetchQuery({
        queryKey: ['music-shorts'],
        queryFn: fetchAllMusicShorts,
      });
      return shorts;
    },
    refreshMusicBanners: async () => {
      const banners = await queryClient.fetchQuery({
        queryKey: ['music-banners'],
        queryFn: fetchAllMusicBanners,
      });
      return banners;
    },
    fetchMusicByIdRemote: fetchMusicById,
    fetchAlbumByIdRemote: fetchAlbumById,
    fetchClipByIdRemote: fetchClipById,
    fetchConcertByIdRemote: fetchConcertById,
  }), [
    allMusic,
    allAlbums,
    allClips,
    allConcerts,
    allArtistMusicStories,
    allArtists,
    allMusicShorts,
    musicShortsCatalog,
    allMusicBanners,
    sections,
    clipSections,
    concertSections,
    pageContent,
    loading,
    musicShortsLoading,
    musicBannersLoading,
    musicLoading,
    albumsLoading,
    clipsLoading,
    concertsLoading,
    sectionsLoading,
    clipSectionsLoading,
    concertSectionsLoading,
    pageContentLoading,
    error,
    queryClient,
  ]);

  return (
    <MusicApiContext.Provider value={value}>
      {children}
    </MusicApiContext.Provider>
  );
};

export const useMusicApi = () => {
  const ctx = useContext(MusicApiContext);
  if (!ctx) {
    throw new Error('useMusicApi must be used within MusicApiProvider');
  }
  return ctx;
};

export default MusicApiContext;
