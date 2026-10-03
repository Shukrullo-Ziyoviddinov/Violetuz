/**
 * Klip kartochkalari:
 * - klip detail "o'xshash" → GET /music/:id/similar?type=klip (cache)
 * - music/album/konsert "tavsiya" → lokal genre (katalogdan)
 * recommendation-music ga ulanmaydi.
 */

import { useEffect, useMemo, useState } from 'react';
import { fetchSimilarMusicItems } from '../api/musicSimilarApi';
import { useMusicApi } from '../context/MusicApiContext';

const ensureArray = (arr) => (Array.isArray(arr) ? arr : []);

const normalizeGenre = (g) =>
  typeof g === 'string' ? g.toLowerCase().trim() : null;

const isKlipType = (type) => {
  const t = String(type || '').toLowerCase();
  return t === 'klip' || t === 'clip';
};

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

const withSectionId = (items) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    ...item,
    sectionId: SECTION_BY_CATEGORY[item.categoryNameMusic] || 'trend-clips',
  }));

const getLocalRecommendedClips = (item, pool, options = {}) => {
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

/**
 * @param {object|null|undefined} item
 * @param {{ limit?: number, excludeId?: string|number }} [options]
 * @param {Array} [pool]
 */
export const fetchRecommendedClips = async (item, options = {}, pool = []) => {
  if (!item?.id) return [];

  if (isKlipType(item.type)) {
    try {
      const rows = await fetchSimilarMusicItems(item.id, {
        type: 'klip',
        limit: options.limit,
      });
      if (rows.length) {
        const exclude =
          options.excludeId != null ? String(options.excludeId) : null;
        const filtered = exclude
          ? rows.filter((row) => String(row.id) !== exclude)
          : rows;
        return withSectionId(filtered);
      }
    } catch {
      /* fallback local */
    }
  }

  return getLocalRecommendedClips(item, pool, options);
};

/**
 * @param {object|null|undefined} item
 * @param {{ limit?: number, excludeId?: string|number }} [options]
 * @returns {{ items: Array, isLoading: boolean }}
 */
export const useRecommendedClips = (item, options = {}) => {
  const { allClips, allConcerts, clipsLoading, concertsLoading } = useMusicApi();
  const itemId = item?.id;
  const isKlip = isKlipType(item?.type);
  const limit = options?.limit;
  const excludeId = options?.excludeId;
  const [apiItems, setApiItems] = useState([]);
  const [apiLoading, setApiLoading] = useState(Boolean(itemId && isKlip));

  const pool = useMemo(
    () => [
      ...(Array.isArray(allClips) ? allClips : []),
      ...(Array.isArray(allConcerts) ? allConcerts : []),
    ],
    [allClips, allConcerts]
  );

  const catalogLoading = Boolean(clipsLoading) || Boolean(concertsLoading);

  useEffect(() => {
    let cancelled = false;
    const id = itemId == null ? '' : String(itemId).trim();

    if (!id || !isKlip) {
      setApiItems([]);
      setApiLoading(false);
      return undefined;
    }

    setApiLoading(true);
    fetchSimilarMusicItems(id, { type: 'klip', limit })
      .then((rows) => {
        if (cancelled) return;
        const exclude = excludeId != null ? String(excludeId) : null;
        const filtered = exclude
          ? rows.filter((row) => String(row.id) !== exclude)
          : rows;
        setApiItems(withSectionId(filtered));
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
  }, [itemId, isKlip, limit, excludeId]);

  const localItems = useMemo(() => {
    if (!itemId || catalogLoading) return [];
    if (isKlip && apiItems.length) return [];
    return getLocalRecommendedClips(item, pool, { limit, excludeId });
  }, [
    itemId,
    item,
    pool,
    catalogLoading,
    isKlip,
    apiItems.length,
    limit,
    excludeId,
  ]);

  const items = isKlip && apiItems.length ? apiItems : localItems;
  const isLoading =
    Boolean(itemId) && (isKlip ? apiLoading : catalogLoading);

  return { items, isLoading };
};
