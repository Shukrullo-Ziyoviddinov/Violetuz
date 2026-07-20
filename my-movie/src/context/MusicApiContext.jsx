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
    musicQuery.isLoading ||
    albumsQuery.isLoading ||
    clipsQuery.isLoading ||
    concertsQuery.isLoading ||
    sectionsQuery.isLoading ||
    clipSectionsQuery.isLoading ||
    concertSectionsQuery.isLoading ||
    pageContentQuery.isLoading;
  const error =
    musicQuery.error?.message ||
    albumsQuery.error?.message ||
    clipsQuery.error?.message ||
    concertsQuery.error?.message ||
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
    sections,
    clipSections,
    concertSections,
    pageContent,
    loading,
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
    fetchMusicByIdRemote: fetchMusicById,
    fetchAlbumByIdRemote: fetchAlbumById,
    fetchClipByIdRemote: fetchClipById,
    fetchConcertByIdRemote: fetchConcertById,
  }), [
    allMusic,
    allAlbums,
    allClips,
    allConcerts,
    sections,
    clipSections,
    concertSections,
    pageContent,
    loading,
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
