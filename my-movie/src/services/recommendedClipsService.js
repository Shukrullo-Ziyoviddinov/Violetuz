/**
 * Tavsiya etilgan kliplar / konsertlar servisi.
 * Pool: allClips + allConcerts. Genre bo‘yicha tartib (lokal heuristika).
 */

import { useMemo } from 'react';
import { useMusicApi } from '../context/MusicApiContext';

const ensureArray = (arr) => (Array.isArray(arr) ? arr : []);

const normalizeGenre = (g) =>
  typeof g === 'string' ? g.toLowerCase().trim() : null;

const isClipOrConcertType = (type) => {
  const t = String(type || '').toLowerCase();
  return t === 'klip' || t === 'clip' || t === 'konsert' || t === 'concert';
};

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

const getRecommendedClipsFromList = (item, pool, options = {}) => {
  const { limit = 12, excludeId } = options;
  if (!item?.id) return [];

  const genre = normalizeGenre(item.genre);
  const exclude = excludeId != null ? String(excludeId) : null;
  const seenIds = new Set();

  const combined = ensureArray(pool)
    .filter((c) => isClipOrConcertType(c.type) && !seenIds.has(c.id))
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

export const fetchRecommendedClips = async (item, options = {}, pool = []) =>
  Promise.resolve(getRecommendedClipsFromList(item, pool, options));

/**
 * @returns {{ items: Array, isLoading: boolean }}
 */
export const useRecommendedClips = (item, options = {}) => {
  const { allClips, allConcerts, clipsLoading, concertsLoading } = useMusicApi();
  const itemId = item?.id;
  const excludeId = options?.excludeId;
  const limit = options?.limit;

  const pool = useMemo(
    () => [
      ...(Array.isArray(allClips) ? allClips : []),
      ...(Array.isArray(allConcerts) ? allConcerts : []),
    ],
    [allClips, allConcerts]
  );

  const catalogLoading = Boolean(clipsLoading) || Boolean(concertsLoading);
  const isLoading = Boolean(itemId) && catalogLoading;

  const items = useMemo(() => {
    if (!itemId || catalogLoading) return [];
    return getRecommendedClipsFromList(item, pool, { limit, excludeId });
  }, [itemId, item, pool, catalogLoading, limit, excludeId]);

  return { items, isLoading };
};
