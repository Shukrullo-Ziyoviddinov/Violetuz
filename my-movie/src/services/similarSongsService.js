/**
 * Musiqa kartochkalari:
 * - music detail "o'xshash" → GET /music/:id/similar?type=music (cache)
 * - klip "tavsiya musiqa" → lokal genre (katalogdan)
 * - album "siz uchun" → music-home-feed (Home for-you algoritmi; ForYouMusic UI emas)
 * recommendation-music ga ulanmaydi.
 */

import { useEffect, useMemo, useState } from 'react';
import { fetchSimilarMusicItems } from '../api/musicSimilarApi';
import { fetchViewerMusicHomeFeed } from '../api/musicHomeFeedApi';
import { useMusicApi } from '../context/MusicApiContext';
import { useMusicHomeFeed } from '../hooks/useMusicHomeFeed';
import { getListenHistory } from '../utils/localStorage/guestHistory/musicGuestHistory';

const ensureArray = (arr) => (Array.isArray(arr) ? arr : []);

const normalizeGenre = (g) =>
  typeof g === 'string' ? g.toLowerCase().trim() : null;

const isAlbumType = (type) => {
  const t = String(type || '').toLowerCase();
  return t === 'musicalbom' || t === 'album' || t === 'music_album';
};

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
 * Home for-you hydrate — ForYouMusic.jsx bilan bir xil:
 * feed.contentId → allMusic track.
 */
const hydrateHomeFeedTracks = (feedRows, allMusic, options = {}) => {
  const { limit = 12 } = options;
  const byId = new Map(
    ensureArray(allMusic).map((track) => [String(track.id), track])
  );
  const out = [];
  for (const row of ensureArray(feedRows)) {
    const track = byId.get(String(row.contentId));
    if (!track) continue;
    out.push(track);
    if (out.length >= limit) break;
  }
  return withSectionId(out);
};

const getLocalSimilarSongs = (item, allMusic, options = {}) => {
  const { limit = 12 } = options;
  if (!item?.id) return [];
  // Album path: local genre o'chirilgan
  if (isAlbumType(item.type)) return [];

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
 * @param {{ limit?: number, isLoggedIn?: boolean, source?: string }} [options]
 * @param {Array} [allMusic]
 */
export const fetchSimilarSongs = async (item, options = {}, allMusic = []) => {
  if (!item?.id) return [];
  const type = String(item.type || '').toLowerCase();
  const useHomeFeed = options.source === 'homeFeed';

  // Faqat source=homeFeed (album detail) — Home for-you algoritmi
  if (useHomeFeed) {
    try {
      const result = await fetchViewerMusicHomeFeed({
        isLoggedIn: Boolean(options.isLoggedIn),
        localHistory: options.isLoggedIn ? undefined : getListenHistory(),
      });
      return hydrateHomeFeedTracks(result.tracks, allMusic, {
        limit: options.limit,
      });
    } catch {
      return [];
    }
  }

  // Album default: local yo'q, homeFeed ham yo'q (source kerak)
  if (isAlbumType(type)) return [];

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
 * @param {{ limit?: number, source?: 'homeFeed'|string }} [options]
 * @returns {{ items: Array, isLoading: boolean }}
 */
export const useSimilarSongs = (item, options = {}) => {
  const { allMusic, musicLoading } = useMusicApi();
  const itemId = item?.id;
  const itemType = String(item?.type || '').toLowerCase();
  const isMusic = itemType === 'music';
  const isAlbum = isAlbumType(itemType);
  const useHomeFeed = options.source === 'homeFeed';
  const limit = options?.limit;
  const [apiItems, setApiItems] = useState([]);
  const [apiLoading, setApiLoading] = useState(
    Boolean(itemId && isMusic && !useHomeFeed)
  );

  // Faqat source=homeFeed — Home for-you (ForYouMusic.jsx ko'chirilmaydi)
  const { items: homeFeedRows, isLoading: homeFeedLoading } = useMusicHomeFeed({
    enabled: Boolean(itemId && useHomeFeed),
  });

  useEffect(() => {
    let cancelled = false;
    const id = itemId == null ? '' : String(itemId).trim();

    if (!id || !isMusic || useHomeFeed) {
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
  }, [itemId, isMusic, useHomeFeed, limit]);

  const homeFeedItems = useMemo(() => {
    if (!useHomeFeed) return [];
    if (musicLoading) return [];
    return hydrateHomeFeedTracks(homeFeedRows, allMusic, { limit });
  }, [useHomeFeed, homeFeedRows, allMusic, musicLoading, limit]);

  const localItems = useMemo(() => {
    if (!itemId || musicLoading) return [];
    if (useHomeFeed || isAlbum) return [];
    if (isMusic && apiItems.length) return [];
    return getLocalSimilarSongs(item, allMusic, { limit });
  }, [
    itemId,
    item,
    allMusic,
    musicLoading,
    isMusic,
    isAlbum,
    useHomeFeed,
    apiItems.length,
    limit,
  ]);

  if (useHomeFeed) {
    return {
      items: homeFeedItems,
      isLoading: Boolean(homeFeedLoading) || Boolean(musicLoading),
    };
  }

  const items = isMusic && apiItems.length ? apiItems : localItems;
  const isLoading =
    Boolean(itemId) &&
    (isMusic ? apiLoading : Boolean(musicLoading));

  return { items, isLoading };
};
