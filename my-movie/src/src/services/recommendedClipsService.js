/**
 * Tavsiya etilgan kliplar servisi.
 * type: 'klip' va genre bo'yicha music bilan mos kliplar.
 * Har bir klip sectionId bilan – VideoPage right-scroll uchun.
 * Backend: GET /api/recommended-clips/:musicId orqali API ulash oson.
 *
 * @example Backend ulash:
 * const res = await fetch(`/api/recommended-clips/${musicId}?limit=${limit}`);
 * const data = await res.json();
 * return (data.items || []).map(c => ({ ...c, sectionId: c.sectionId || 'trend-clips' }));
 */

import { useState, useEffect } from 'react';
import { trendClipsData } from '../dataMusic/trendClipsData';
import { visualBeatsData } from '../dataMusic/visualBeatsData';
import { loveAndDesireData } from '../dataMusic/loveAndDesireData';
import { trendVideosData } from '../dataMusic/trendVideosData';
import { stageCreationData } from '../dataMusic/stageCreationData';

const ensureArray = (arr) => (Array.isArray(arr) ? arr : []);

/** Genre ni normalizatsiya qilish (case-insensitive) */
const normalizeGenre = (g) =>
  typeof g === 'string' ? g.toLowerCase().trim() : null;

/** Klip bo'limlari (type: 'klip') */
const CLIP_SOURCES = [
  { sectionId: 'trend-clips', data: trendClipsData },
  { sectionId: 'visual-beats', data: visualBeatsData },
  { sectionId: 'sevgi-va-ichq', data: loveAndDesireData },
  { sectionId: 'trend-videos', data: trendVideosData },
  { sectionId: 'sahnadagi-ijod', data: stageCreationData },
];

/** Frontend: mahalliy datadan o'xshash kliplarni filter qiladi (sectionId bilan).
 *  Barcha bo'limlardan type:'klip' olish, har biri o'z sectionId sini saqlaydi.
 *  options.excludeId – VideoPage da hozirgi klippi chiqarish uchun. */
const getRecommendedClipsFromLocal = (item, options = {}) => {
  const { limit = 12, excludeId } = options;
  if (!item?.id) return [];

  const genre = normalizeGenre(item.genre);
  const seenIds = new Set();
  const exclude = excludeId != null ? String(excludeId) : null;

  // 1. Barcha bo'limlardan type:'klip' kliplarni sectionId bilan birlashtirish
  let combined = [];
  for (const { sectionId, data } of CLIP_SOURCES) {
    const clipsOnly = ensureArray(data).filter(
      (c) => c.type === 'klip' && !seenIds.has(c.id) && (!exclude || String(c.id) !== exclude)
    );
    for (const clip of clipsOnly) {
      seenIds.add(clip.id);
      combined.push({ ...clip, sectionId });
    }
  }

  // 2. Genre bo'yicha saralash: birinchi o'sha genre, keyin qolganlar
  let sorted = combined;
  if (genre) {
    const sameGenre = combined.filter(
      (item) =>
        item.genre && normalizeGenre(item.genre) === genre
    );
    const otherGenre = combined.filter(
      (item) => !item.genre || normalizeGenre(item.genre) !== genre
    );
    sorted = [...sameGenre, ...otherGenre];
  }

  return sorted.slice(0, limit);
};

/**
 * Tavsiya kliplarni olish.
 * Backend ulanganda: fetchRecommendedClips ni API ga almashtiring.
 */
export const fetchRecommendedClips = async (item, options = {}) => {
  return Promise.resolve(getRecommendedClipsFromLocal(item, options));
};

/**
 * Tavsiya kliplarni React hook orqali olish.
 *
 * @param {Object} item - Music, album yoki klip { id, genre, ... }
 * @param {Object} options - { limit, excludeId }
 * @returns {Array} Kliplar ro'yxati
 */
export const useRecommendedClips = (item, options = {}) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!item?.id) {
      setItems([]);
      return;
    }
    let cancelled = false;
    fetchRecommendedClips(item, options).then((data) => {
      if (!cancelled && Array.isArray(data)) {
        setItems(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [item?.id, options.excludeId]);

  return items;
};
