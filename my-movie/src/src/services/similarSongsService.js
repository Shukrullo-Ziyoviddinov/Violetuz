/**
 * O'xshash musiqalar servisi.
 * Frontend: type='music' va genre bo'yicha filter.
 * Har bir musiqa sectionId bilan – MusicDetail right-scroll uchun.
 * Backend: GET /api/similar-songs/:musicId orqali API ulash oson.
 *
 * @example Backend ulash:
 * const res = await fetch(`/api/similar-songs/${musicId}?limit=${limit}`);
 * const data = await res.json();
 * return (data.items || []).map(m => ({ ...m, sectionId: m.sectionId || 'trend' }));
 */

import { useState, useEffect } from 'react';
import { trendMusicData } from '../dataMusic/trendMusicData';
import { discoverMusicData } from '../dataMusic/discoverMusicData';
import { musicLibraryData } from '../dataMusic/musicLibraryData';
import { musicHubData } from '../dataMusic/musicHubData';
import { bassMusicData } from '../dataMusic/bassMusicData';
import { topNasheedsData } from '../dataMusic/topNasheedsData';

const ensureArray = (arr) => (Array.isArray(arr) ? arr : []);

/** Genre ni normalizatsiya qilish (case-insensitive) */
const normalizeGenre = (g) =>
  typeof g === 'string' ? g.toLowerCase().trim() : null;

/** Musiqa bo'limlari (wishlistType: 'music') */
const MUSIC_SOURCES = [
  { sectionId: 'trend', data: trendMusicData },
  { sectionId: 'discover-music', data: discoverMusicData },
  { sectionId: 'music-library', data: musicLibraryData },
  { sectionId: 'music-hub', data: musicHubData },
  { sectionId: 'bass-music', data: bassMusicData },
  { sectionId: 'top-nasheeds', data: topNasheedsData },
];

/** Frontend: mahalliy datadan o'xshash musiqalarni filter qiladi (sectionId bilan).
 *  Barcha bo'limlardan musiqa oladi, har biri o'z sectionId sini saqlaydi. */
const getSimilarSongsFromLocal = (music, options = {}) => {
  const { limit = 12 } = options;
  if (!music?.id) return [];

  const genre = normalizeGenre(music.genre);
  const seenIds = new Set();

  // 1. Barcha bo'limlardan type:'music' treklarni sectionId bilan birlashtirish
  let combined = [];
  for (const { sectionId, data } of MUSIC_SOURCES) {
    const musicOnly = ensureArray(data).filter(
      (item) => item.type === 'music' && !seenIds.has(item.id) && String(item.id) !== String(music.id)
    );
    for (const track of musicOnly) {
      seenIds.add(track.id);
      combined.push({ ...track, sectionId });
    }
  }

  // 2. Genre bo'yicha saralash: birinchi o'sha genre, keyin qolganlar
  let sorted = combined;
  if (genre) {
    const sameGenre = combined.filter(
      (item) => item.genre && normalizeGenre(item.genre) === genre
    );
    const otherGenre = combined.filter(
      (item) => !item.genre || normalizeGenre(item.genre) !== genre
    );
    sorted = [...sameGenre, ...otherGenre];
  }

  return sorted.slice(0, limit);
};

/**
 * O'xshash musiqalarni olish.
 * Backend ulanganda: fetchSimilarSongs ni API ga almashtiring.
 *
 * @param {Object} music - Hozirgi musiqa obyekti { id, genre, ... }
 * @param {Object} options - { limit }
 * @returns {Promise<Array>} O'xshash musiqalar ro'yxati
 */
export const fetchSimilarSongs = async (music, options = {}) => {
  // Backend ulashda:
  // const res = await fetch(`/api/similar-songs/${music.id}?limit=${options.limit || 12}`);
  // if (!res.ok) return [];
  // const json = await res.json();
  // return Array.isArray(json.items) ? json.items : [];

  return Promise.resolve(getSimilarSongsFromLocal(music, options));
};

/**
 * O'xshash musiqalarni React hook orqali olish.
 * Backend ulanganda fetchSimilarSongs ichidagi API chaqiruvini o'zgartiring.
 *
 * @param {Object} music - Hozirgi musiqa obyekti
 * @param {Object} options - { limit }
 * @returns {Array} O'xshash musiqalar ro'yxati
 */
export const useSimilarSongs = (music, options = {}) => {
  const [items, setItems] = useState([]);

  const musicId = music?.id;
  const limit = options?.limit;

  useEffect(() => {
    if (!musicId) {
      setItems([]);
      return;
    }
    let cancelled = false;
    fetchSimilarSongs(music, { limit }).then((data) => {
      if (!cancelled && Array.isArray(data)) {
        setItems(data);
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- music object ref o'zgarsa ham id orqali qayta yuklash
  }, [musicId, limit]);

  return items;
};
