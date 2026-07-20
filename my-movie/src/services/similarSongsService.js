/**
 * O'xshash musiqalar servisi.
 * Frontend: type='music' va genre bo'yicha filter.
 * Backend music collection orqali API/DB dan kelgan ma'lumot ishlatiladi.
 */

import { useState, useEffect } from 'react';
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

const getSimilarSongsFromList = (music, allMusic, options = {}) => {
  const { limit = 12 } = options;
  if (!music?.id) return [];

  const currentGenre = normalizeGenre(music.genre);
  const pool = ensureArray(allMusic)
    .filter((item) => item?.id != null && String(item.id) !== String(music.id))
    .map((item) => ({
      ...item,
      sectionId: SECTION_BY_CATEGORY[item.categoryNameMusic] || 'trend',
    }));

  const sameGenre = currentGenre
    ? pool.filter((item) => normalizeGenre(item.genre) === currentGenre)
    : [];

  const sorted = [...sameGenre, ...pool.filter((item) => !sameGenre.includes(item))];
  return sorted.slice(0, limit);
};

export const fetchSimilarSongs = async (music, options = {}, allMusic = []) =>
  Promise.resolve(getSimilarSongsFromList(music, allMusic, options));

export const useSimilarSongs = (music, options = {}) => {
  const { allMusic } = useMusicApi();
  const [items, setItems] = useState([]);

  const musicId = music?.id;
  const limit = options?.limit;

  useEffect(() => {
    if (!musicId) {
      setItems([]);
      return;
    }
    let cancelled = false;
    fetchSimilarSongs(music, { limit }, allMusic).then((data) => {
      if (!cancelled && Array.isArray(data)) {
        setItems(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [musicId, limit, music, allMusic]);

  return items;
};
