/**
 * O'xshash musiqalar — GET /music/:id/similar?type=music (cache).
 * Local heuristika yo'q. recommendation-music ga ulanmaydi.
 */

import { useEffect, useState } from 'react';
import { fetchSimilarMusicItems } from '../api/musicSimilarApi';

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

/**
 * Faqat music type uchun similar. Album/klip "for you" — bo'sh (cross-type yo'q).
 * @param {object|null|undefined} music
 * @param {{ limit?: number }} [options]
 */
export const fetchSimilarSongs = async (music, options = {}) => {
  if (!music?.id || String(music.type || '').toLowerCase() !== 'music') {
    return [];
  }
  const rows = await fetchSimilarMusicItems(music.id, {
    type: 'music',
    limit: options.limit,
  });
  return withSectionId(rows);
};

/**
 * @param {object|null|undefined} music
 * @param {{ limit?: number }} [options]
 * @returns {{ items: Array, isLoading: boolean }}
 */
export const useSimilarSongs = (music, options = {}) => {
  const musicId = music?.id;
  const isMusic = String(music?.type || '').toLowerCase() === 'music';
  const limit = options?.limit;
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(musicId && isMusic));

  useEffect(() => {
    let cancelled = false;
    const id = musicId == null ? '' : String(musicId).trim();

    if (!id || !isMusic) {
      setItems([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    fetchSimilarSongs(music, { limit })
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
  }, [musicId, isMusic, music, limit]);

  return { items, isLoading };
};
