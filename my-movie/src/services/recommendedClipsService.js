/**
 * O'xshash kliplar — GET /music/:id/similar?type=klip (cache).
 * Local heuristika yo'q. Concert similar yo'q. recommendation-music ga ulanmaydi.
 */

import { useEffect, useState } from 'react';
import { fetchSimilarMusicItems } from '../api/musicSimilarApi';

const SECTION_BY_CATEGORY = {
  trendClipsData: 'trend-clips',
  visualBeatsData: 'visual-beats',
  loveAndDesireData: 'sevgi-va-ichq',
  trendVideosData: 'trend-videos',
  stageCreationData: 'sahnadagi-ijod',
  liveStagesData: 'live-stages',
  jaxonConcertsData: 'jaxon-concerts',
  starsStageData: 'stars-stage',
};

const isKlipType = (type) => {
  const t = String(type || '').toLowerCase();
  return t === 'klip' || t === 'clip';
};

const withSectionId = (items) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    sectionId: SECTION_BY_CATEGORY[item.categoryNameMusic] || 'trend-clips',
  }));

/**
 * Faqat klip type. Music/album/konsert — bo'sh.
 * @param {object|null|undefined} item
 * @param {{ limit?: number, excludeId?: string|number }} [options]
 */
export const fetchRecommendedClips = async (item, options = {}) => {
  if (!item?.id || !isKlipType(item.type)) return [];
  const rows = await fetchSimilarMusicItems(item.id, {
    type: 'klip',
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
export const useRecommendedClips = (item, options = {}) => {
  const itemId = item?.id;
  const isKlip = isKlipType(item?.type);
  const limit = options?.limit;
  const excludeId = options?.excludeId;
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(itemId && isKlip));

  useEffect(() => {
    let cancelled = false;
    const id = itemId == null ? '' : String(itemId).trim();

    if (!id || !isKlip) {
      setItems([]);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    fetchRecommendedClips(item, { limit, excludeId })
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
  }, [itemId, isKlip, item, limit, excludeId]);

  return { items, isLoading };
};
