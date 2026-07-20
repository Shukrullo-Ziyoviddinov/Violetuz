/**
 * Tavsiya etilgan kliplar servisi.
 * type: 'klip' va genre bo'yicha music bilan mos kliplar.
 * Backend: GET /api/clips orqali API/DB dan keladi.
 */

import { useState, useEffect } from 'react';
import { useMusicApi } from '../context/MusicApiContext';

const ensureArray = (arr) => (Array.isArray(arr) ? arr : []);

const normalizeGenre = (g) =>
  typeof g === 'string' ? g.toLowerCase().trim() : null;

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

const getRecommendedClipsFromList = (item, allClips, options = {}) => {
  const { limit = 12, excludeId } = options;
  if (!item?.id) return [];

  const genre = normalizeGenre(item.genre);
  const exclude = excludeId != null ? String(excludeId) : null;
  const seenIds = new Set();

  const combined = ensureArray(allClips)
    .filter((c) => (c.type === 'klip' || c.type === 'konsert') && !seenIds.has(c.id))
    .filter((c) => !exclude || String(c.id) !== exclude)
    .map((clip) => {
      seenIds.add(clip.id);
      return {
        ...clip,
        sectionId: SECTION_BY_CATEGORY[clip.categoryNameMusic] || 'trend-clips',
      };
    });

  let sorted = combined;
  if (genre) {
    const sameGenre = combined.filter(
      (c) => c.genre && normalizeGenre(c.genre) === genre
    );
    const otherGenre = combined.filter(
      (c) => !c.genre || normalizeGenre(c.genre) !== genre
    );
    sorted = [...sameGenre, ...otherGenre];
  }

  return sorted.slice(0, limit);
};

export const fetchRecommendedClips = async (item, options = {}, allClips = []) =>
  Promise.resolve(getRecommendedClipsFromList(item, allClips, options));

export const useRecommendedClips = (item, options = {}) => {
  const { allClips } = useMusicApi();
  const [items, setItems] = useState([]);
  const itemId = item?.id;
  const excludeId = options?.excludeId;
  const limit = options?.limit;

  useEffect(() => {
    if (!itemId) {
      setItems([]);
      return;
    }
    let cancelled = false;
    fetchRecommendedClips(item, { limit, excludeId }, allClips).then((data) => {
      if (!cancelled && Array.isArray(data)) {
        setItems(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [itemId, excludeId, limit, item, allClips]);

  return items;
};
