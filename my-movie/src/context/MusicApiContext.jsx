import React, { createContext, useContext, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllMusic,
  fetchMusicById,
  fetchMusicSections,
  fetchMusicPageContent,
} from '../api/musicApi';
import { fetchAllAlbums, fetchAlbumById } from '../api/albumsApi';

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

  const sectionsQuery = useQuery({
    queryKey: ['music-sections'],
    queryFn: fetchMusicSections,
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
  const sections = useMemo(
    () => (Array.isArray(sectionsQuery.data) ? sectionsQuery.data : []),
    [sectionsQuery.data]
  );
  const pageContent = useMemo(
    () => (Array.isArray(pageContentQuery.data) ? pageContentQuery.data : []),
    [pageContentQuery.data]
  );

  const loading =
    musicQuery.isLoading ||
    albumsQuery.isLoading ||
    sectionsQuery.isLoading ||
    pageContentQuery.isLoading;
  const error =
    musicQuery.error?.message ||
    albumsQuery.error?.message ||
    sectionsQuery.error?.message ||
    pageContentQuery.error?.message ||
    null;

  const value = useMemo(() => ({
    allMusic,
    allAlbums,
    sections,
    pageContent,
    loading,
    error,
    getMusicByCategory: (categoryNameMusic) =>
      allMusic.filter((item) => item.categoryNameMusic === categoryNameMusic),
    getAlbumsByCategory: (categoryNameMusic) =>
      allAlbums.filter((item) => item.categoryNameMusic === categoryNameMusic),
    getSectionItems: (section) => {
      if (!section?.categoryNameMusic) return [];
      if (section.wishlistType === 'album') {
        return allAlbums.filter((item) => item.categoryNameMusic === section.categoryNameMusic);
      }
      return allMusic.filter((item) => item.categoryNameMusic === section.categoryNameMusic);
    },
    getMusicByArtist: (artistId) =>
      allMusic.filter((item) => item.artistId === artistId),
    getAlbumsByArtist: (artistId) =>
      allAlbums.filter((item) => item.artistId === artistId),
    getSectionById: (id) => sections.find((s) => s.id === id) || null,
    getMusicByIdLocal: (id) =>
      allMusic.find((item) => String(item.id) === String(id)) || null,
    getAlbumByIdLocal: (id) =>
      allAlbums.find((item) => String(item.id) === String(id)) || null,
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
    fetchMusicByIdRemote: fetchMusicById,
    fetchAlbumByIdRemote: fetchAlbumById,
  }), [allMusic, allAlbums, sections, pageContent, loading, error, queryClient]);

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
