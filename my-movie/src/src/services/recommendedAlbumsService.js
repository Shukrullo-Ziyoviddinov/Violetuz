/**
 * Siz uchun albomlar servisi.
 * type: 'musicAlbom' va genre bo'yicha music bilan mos albomlar.
 * Har bir albomga sectionId qo'shiladi – MusicAlbumDetail right-scroll uchun.
 * Backend: GET /api/recommended-albums/:musicId orqali API ulash oson.
 *
 * @example Backend ulash:
 * const res = await fetch(`/api/recommended-albums/${musicId}?limit=${limit}`);
 * const data = await res.json();
 * return (data.items || []).map(a => ({ ...a, sectionId: a.sectionId || 'albums' }));
 */

import { useState, useEffect } from 'react';
import { TopAlbums } from '../dataMusic/topAlbumsData';
import { musicDropsData } from '../dataMusic/musicDropsData';
import { sevgiVaMusiqaData } from '../dataMusic/sevgiVaMusiqaData';
import { hitCollectionsData } from '../dataMusic/hitCollectionsData';

const ensureArray = (arr) => (Array.isArray(arr) ? arr : []);

/** Genre ni normalizatsiya qilish (case-insensitive) */
const normalizeGenre = (g) =>
  typeof g === 'string' ? g.toLowerCase().trim() : null;

/** Bo'lim manbalari: sectionId -> albomlar massivi */
const ALBUM_SOURCES = [
  { sectionId: 'albums', data: TopAlbums },
  { sectionId: 'music-drops', data: musicDropsData },
  { sectionId: 'sevgi-va-musiqa', data: sevgiVaMusiqaData },
  { sectionId: 'hit-collections', data: hitCollectionsData },
];

/** Frontend: mahalliy datadan genre bo'yicha albomlarni filter qiladi (sectionId bilan).
 *  Barcha bo'limlardan albom oladi, har bir albom o'z sectionId sini saqlaydi.
 *  options.excludeId – albom sahifasida hozirgi albomni chiqarib tashlash uchun. */
const getRecommendedAlbumsFromLocal = (item, options = {}) => {
  const { limit = 12, excludeId } = options;
  if (!item?.id) return [];

  const itemGenre = normalizeGenre(item.genre);
  const seenIds = new Set();
  const exclude = excludeId != null ? String(excludeId) : null;

  // 1. Barcha bo'limlardan albomlarni sectionId bilan birlashtirish
  let combined = [];
  for (const { sectionId, data } of ALBUM_SOURCES) {
    const albumsOnly = ensureArray(data).filter(
      (a) =>
        a.type === 'musicAlbom' &&
        !seenIds.has(a.id) &&
        (!exclude || String(a.id) !== exclude)
    );
    for (const album of albumsOnly) {
      seenIds.add(album.id);
      combined.push({ ...album, sectionId });
    }
  }

  // 2. Genre bo'yicha saralash: birinchi o'sha genre, keyin qolganlar
  let sorted = combined;
  if (itemGenre) {
    const sameGenre = combined.filter(
      (a) => a.genre && normalizeGenre(a.genre) === itemGenre
    );
    const otherGenre = combined.filter(
      (a) => !a.genre || normalizeGenre(a.genre) !== itemGenre
    );
    sorted = [...sameGenre, ...otherGenre];
  }

  return sorted.slice(0, limit);
};

/**
 * Tavsiya albomlarni olish.
 * item – music yoki album (id, genre).
 * options.excludeId – albom sahifasida hozirgi albomni chiqarish.
 */
export const fetchRecommendedAlbums = async (item, options = {}) => {
  return Promise.resolve(getRecommendedAlbumsFromLocal(item, options));
};

/**
 * Tavsiya albomlarni React hook orqali olish.
 *
 * @param {Object} item - Music yoki album { id, genre, ... }
 * @param {Object} options - { limit, excludeId }
 * @returns {Array} Albomlar ro'yxati
 */
export const useRecommendedAlbums = (item, options = {}) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!item?.id) {
      setItems([]);
      return;
    }
    let cancelled = false;
    fetchRecommendedAlbums(item, options).then((data) => {
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
