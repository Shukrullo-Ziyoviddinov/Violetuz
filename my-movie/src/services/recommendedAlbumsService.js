/**
 * O'xshash albomlar — GET /music/:id/similar?type=album (cache).
 * Local heuristika yo'q. recommendation-music ga ulanmaydi.
 */

import { useEffect, useState } from 'react';
import { fetchSimilarMusicItems } from '../api/musicSimilarApi';

const SECTION_BY_CATEGORY = {
  TopAlbums: 'albums',
  musicDropsData: 'music-drops',
  sevgiVaMusiqaData: 'sevgi-va-musiqa',
  hitCollectionsData: 'hit-collections',
};

const isAlbumType = (type) => {
  const t = String(type || '').toLowerCase();
  return t === 'musicalbom' || t === 'album' || t === 'music_album';
};

const withSectionId = (items) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    sectionId: SECTION_BY_CATEGORY[item.categoryNameMusic] || 'albums',
  }));

/**
 * Faqat album type. Music/klip — bo'sh (cross-type yo'q).
 * @param {object|null|undefined} item
 * @param {{ limit?: number, excludeId?: string|number }} [options]
 */
export const fetchRecommendedAlbums = async (item, options = {}) => {
  if (!item?.id || !isAlbumType(item.type)) return [];
  const rows = await fetchSimilarMusicItems(item.id, {
    type: 'album',
    limit: options.limit,
  });
  const exclude =
    options.excludeId != null ? String(options.excludeId) : null;
  const filtered = exclude
    ? rows.filter((row) => String(row.id) !== exclude)
    : rows;
  return withSectionId(filtered);
};

/**
 * @param {object|null|undefined} item
 * @param {{ limit?: number, excludeId?: string|number }} [options]
 * @returns {{ items: Array, isLoading: boolean }}
 */
export const useRecommendedAlbums = (item, options = {}) => {
  const itemId = item?.id;
  const isAlbum = isAlbumType(item?.type);
  const limit = options?.limit;
  const excludeId = options?.excludeId;
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(itemId && isAlbum));

  useEffect(() => {
    let cancelled = false;
    const id = itemId == null ? '' : String(itemId).trim();

    if (!id || !isAlbum) {
      setItems([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    fetchRecommendedAlbums(item, { limit, excludeId })
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [itemId, isAlbum, item, limit, excludeId]);

  return { items, isLoading };
};
