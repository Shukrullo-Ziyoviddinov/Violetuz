/**
 * Albom kartochkalari:
 * - album detail "o'xshash" → GET /music/:id/similar?type=album (cache)
 * - music/klip "siz uchun" → lokal genre (katalogdan)
 * recommendation-music ga ulanmaydi.
 */

import { useEffect, useMemo, useState } from 'react';
import { fetchSimilarMusicItems } from '../api/musicSimilarApi';
import { useMusicApi } from '../context/MusicApiContext';

const ensureArray = (arr) => (Array.isArray(arr) ? arr : []);

const normalizeGenre = (g) =>
  typeof g === 'string' ? g.toLowerCase().trim() : null;

const isAlbumType = (type) => {
  const t = String(type || '').toLowerCase();
  return t === 'musicalbom' || t === 'album' || t === 'music_album';
};

const SECTION_BY_CATEGORY = {
  TopAlbums: 'albums',
  musicDropsData: 'music-drops',
  sevgiVaMusiqaData: 'sevgi-va-musiqa',
  hitCollectionsData: 'hit-collections',
};

const withSectionId = (items) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    sectionId: SECTION_BY_CATEGORY[item.categoryNameMusic] || 'albums',
  }));

const getLocalRecommendedAlbums = (item, allAlbums, options = {}) => {
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

  const sorted = [
    ...sameGenre,
    ...pool.filter((album) => !sameGenre.includes(album)),
  ];
  return sorted.slice(0, limit);
};

/**
 * @param {object|null|undefined} item
 * @param {{ limit?: number, excludeId?: string|number }} [options]
 * @param {Array} [allAlbums]
 */
export const fetchRecommendedAlbums = async (
  item,
  options = {},
  allAlbums = []
) => {
  if (!item?.id) return [];

  if (isAlbumType(item.type)) {
    try {
      const rows = await fetchSimilarMusicItems(item.id, {
        type: 'album',
        limit: options.limit,
      });
      if (rows.length) {
        const exclude =
          options.excludeId != null ? String(options.excludeId) : null;
        const filtered = exclude
          ? rows.filter((row) => String(row.id) !== exclude)
          : rows;
        return withSectionId(filtered);
      }
    } catch {
      /* fallback local */
    }
  }

  return getLocalRecommendedAlbums(item, allAlbums, options);
};

/**
 * @param {object|null|undefined} item
 * @param {{ limit?: number, excludeId?: string|number }} [options]
 * @returns {{ items: Array, isLoading: boolean }}
 */
export const useRecommendedAlbums = (item, options = {}) => {
  const { allAlbums, albumsLoading } = useMusicApi();
  const itemId = item?.id;
  const isAlbum = isAlbumType(item?.type);
  const limit = options?.limit;
  const excludeId = options?.excludeId;
  const [apiItems, setApiItems] = useState([]);
  const [apiLoading, setApiLoading] = useState(Boolean(itemId && isAlbum));

  useEffect(() => {
    let cancelled = false;
    const id = itemId == null ? '' : String(itemId).trim();

    if (!id || !isAlbum) {
      setApiItems([]);
      setApiLoading(false);
      return undefined;
    }

    setApiLoading(true);
    fetchSimilarMusicItems(id, { type: 'album', limit })
      .then((rows) => {
        if (cancelled) return;
        const exclude = excludeId != null ? String(excludeId) : null;
        const filtered = exclude
          ? rows.filter((row) => String(row.id) !== exclude)
          : rows;
        setApiItems(withSectionId(filtered));
      })
      .catch(() => {
        if (!cancelled) setApiItems([]);
      })
      .finally(() => {
        if (!cancelled) setApiLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [itemId, isAlbum, limit, excludeId]);

  const localItems = useMemo(() => {
    if (!itemId || albumsLoading) return [];
    if (isAlbum && apiItems.length) return [];
    return getLocalRecommendedAlbums(item, allAlbums, { limit, excludeId });
  }, [
    itemId,
    item,
    allAlbums,
    albumsLoading,
    isAlbum,
    apiItems.length,
    limit,
    excludeId,
  ]);

  const items = isAlbum && apiItems.length ? apiItems : localItems;
  const isLoading =
    Boolean(itemId) && (isAlbum ? apiLoading : Boolean(albumsLoading));

  return { items, isLoading };
};
