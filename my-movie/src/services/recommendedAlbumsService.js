/**
 * Tavsiya etilgan albomlar servisi.
 * type: 'musicAlbom' va genre bo'yicha music bilan mos albomlar.
 * Backend: GET /api/albums orqali API/DB dan keladi.
 */

import { useMemo } from 'react';
import { useMusicApi } from '../context/MusicApiContext';

const ensureArray = (arr) => (Array.isArray(arr) ? arr : []);

const normalizeGenre = (g) =>
  typeof g === 'string' ? g.toLowerCase().trim() : null;

const SECTION_BY_CATEGORY = {
  TopAlbums: 'albums',
  musicDropsData: 'music-drops',
  sevgiVaMusiqaData: 'sevgi-va-musiqa',
  hitCollectionsData: 'hit-collections',
};

const getRecommendedAlbumsFromList = (item, allAlbums, options = {}) => {
  const { limit = 12, excludeId } = options;
  if (!item) return [];

  const skipId = excludeId != null ? excludeId : item.id;
  const currentGenre = normalizeGenre(item.genre);
  const pool = ensureArray(allAlbums)
    .filter((album) => album?.type === 'musicAlbom' || Array.isArray(album?.songs))
    .filter((album) => String(album.id) !== String(skipId))
    .map((album) => ({
      ...album,
      sectionId: SECTION_BY_CATEGORY[album.categoryNameMusic] || 'albums',
    }));

  const sameGenre = currentGenre
    ? pool.filter((album) => normalizeGenre(album.genre) === currentGenre)
    : [];

  const sorted = [...sameGenre, ...pool.filter((album) => !sameGenre.includes(album))];
  return sorted.slice(0, limit);
};

export const fetchRecommendedAlbums = async (item, options = {}, allAlbums = []) =>
  Promise.resolve(getRecommendedAlbumsFromList(item, allAlbums, options));

/**
 * @returns {{ items: Array, isLoading: boolean }}
 */
export const useRecommendedAlbums = (item, options = {}) => {
  const { allAlbums, albumsLoading } = useMusicApi();
  const itemId = item?.id;
  const limit = options?.limit;
  const excludeId = options?.excludeId;

  const isLoading = Boolean(itemId) && Boolean(albumsLoading);

  const items = useMemo(() => {
    if (!itemId || albumsLoading) return [];
    return getRecommendedAlbumsFromList(item, allAlbums, { limit, excludeId });
  }, [itemId, item, allAlbums, albumsLoading, limit, excludeId]);

  return { items, isLoading };
};
