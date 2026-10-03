/**
 * Musiqa kartochkalari:
 * - music detail "o'xshash" → GET /music/:id/similar?type=music (cache)
 * - album/klip "siz uchun" → lokal genre (katalogdan)
 * recommendation-music ga ulanmaydi.
 */

import { useEffect, useMemo, useState } from 'react';
import { fetchSimilarMusicItems } from '../api/musicSimilarApi';
import { useMusicApi } from '../context/MusicApiContext';

const ensureArray = (arr) => (Array.isArray(arr) ? arr : []);

const normalizeGenre = (g) =>
  typeof g === 'string' ? g.toLowerCase().trim() : null;

const SECTION_BY_CATEGORY = {
  trendMusicData: 'trend',
  discoverMusicData: 'discover-music',
  musicLibraryData: 'music-library',
  musicHubData: 'music-hub',
  bassMusicData: 'bass-music',
  topNasheedsData: 'top-nasheeds',
};

const withSectionId = (items) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    sectionId: SECTION_BY_CATEGORY[item.categoryNameMusic] || 'trend',
  }));

const getLocalSimilarSongs = (item, allMusic, options = {}) => {
  const { limit = 12 } = options;
  if (!item?.id) return [];

  const currentGenre = normalizeGenre(item.genre);
  const pool = ensureArray(allMusic)
    .filter((row) => row?.id != null && String(row.id) !== String(item.id))
    .map((row) => ({
      ...row,
      sectionId: SECTION_BY_CATEGORY[row.categoryNameMusic] || 'trend',
    }));

  const sameGenre = currentGenre
    ? pool.filter((row) => normalizeGenre(row.genre) === currentGenre)
    : [];

  const sorted = [
    ...sameGenre,
    ...pool.filter((row) => !sameGenre.includes(row)),
  ];
  return sorted.slice(0, limit);
};

/**
 * @param {object|null|undefined} item
 * @param {{ limit?: number }} [options]
 * @param {Array} [allMusic]
 */
export const fetchSimilarSongs = async (item, options = {}, allMusic = []) => {
  if (!item?.id) return [];
  const type = String(item.type || '').toLowerCase();

  if (type === 'music') {
    try {
      const rows = await fetchSimilarMusicItems(item.id, {
        type: 'music',
        limit: options.limit,
      });
      if (rows.length) return withSectionId(rows);
    } catch {
      /* fallback local */
    }
  }

  return getLocalSimilarSongs(item, allMusic, options);
};

/**
 * @param {object|null|undefined} item
 * @param {{ limit?: number }} [options]
 * @returns {{ items: Array, isLoading: boolean }}
 */
export const useSimilarSongs = (item, options = {}) => {
  const { allMusic, musicLoading } = useMusicApi();
  const itemId = item?.id;
  const itemType = String(item?.type || '').toLowerCase();
  const isMusic = itemType === 'music';
  const limit = options?.limit;
  const [apiItems, setApiItems] = useState([]);
  const [apiLoading, setApiLoading] = useState(Boolean(itemId && isMusic));

  useEffect(() => {
    let cancelled = false;
    const id = itemId == null ? '' : String(itemId).trim();

    if (!id || !isMusic) {
      setApiItems([]);
      setApiLoading(false);
      return undefined;
    }

    setApiLoading(true);
    fetchSimilarMusicItems(id, { type: 'music', limit })
      .then((rows) => {
        if (!cancelled) setApiItems(withSectionId(rows));
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
  }, [itemId, isMusic, limit]);

  const localItems = useMemo(() => {
    if (!itemId || musicLoading) return [];
    if (isMusic && apiItems.length) return [];
    return getLocalSimilarSongs(item, allMusic, { limit });
  }, [itemId, item, allMusic, musicLoading, isMusic, apiItems.length, limit]);

  const items = isMusic && apiItems.length ? apiItems : localItems;
  const isLoading =
    Boolean(itemId) &&
    (isMusic ? apiLoading : Boolean(musicLoading));

  return { items, isLoading };
};
