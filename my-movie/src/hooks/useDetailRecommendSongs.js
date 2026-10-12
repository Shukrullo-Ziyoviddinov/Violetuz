import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectAuthReady, selectIsLoggedIn } from '../store/slices/userSlice';
import { fetchViewerDetailRecommend } from '../api/detailRecommendApi';
import { useMusicApi } from '../context/MusicApiContext';
import { getListenHistory } from '../utils/localStorage/guestHistory/musicGuestHistory';
import { GUEST_MUSIC_HISTORY_CHANGED } from '../utils/localStorage/guestHistory/events';

const SECTION_BY_CATEGORY = {
  trendMusicData: 'trend',
  discoverMusicData: 'discover-music',
  musicLibraryData: 'music-library',
  musicHubData: 'music-hub',
  bassMusicData: 'bass-music',
  topNasheedsData: 'top-nasheeds',
};

const isVideoPage = (pageType) => {
  const type = String(pageType || '').trim().toLowerCase();
  return type === 'klip' || type === 'clip' || type === 'konsert' || type === 'concert';
};

const isSong = (row) => {
  const type = String(row?.type || 'music').trim().toLowerCase();
  return type === 'music' || type === '';
};

/**
 * Klip va konsert "Tavsiya etilgan musiqalar". Natija faqat qo'shiq.
 * useSimilarSongs va home-feed hooklariga ulanmaydi.
 *
 * @param {{ enabled?: boolean, pageType?: string, pageId?: string|number }} [opts]
 */
export function useDetailRecommendSongs({ enabled = true, pageType, pageId } = {}) {
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const { allMusic, musicLoading } = useMusicApi();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [guestHistoryEpoch, setGuestHistoryEpoch] = useState(0);

  const pageKey = String(pageId ?? '').trim();
  const typeKey = String(pageType || '').trim();
  const active = Boolean(enabled && isVideoPage(typeKey) && pageKey);

  useEffect(() => {
    const onHistory = () => setGuestHistoryEpoch((n) => n + 1);
    window.addEventListener(GUEST_MUSIC_HISTORY_CHANGED, onHistory);
    return () => window.removeEventListener(GUEST_MUSIC_HISTORY_CHANGED, onHistory);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!active) {
      setRows([]);
      setIsLoading(false);
      return undefined;
    }

    if (!authReady) {
      setRows([]);
      setIsLoading(true);
      return undefined;
    }

    setIsLoading(true);
    const localHistory = isLoggedIn ? undefined : getListenHistory();

    fetchViewerDetailRecommend({
      pageType: typeKey,
      pageId: pageKey,
      isLoggedIn,
      localHistory,
    })
      .then((result) => {
        if (cancelled) return;
        setRows(Array.isArray(result.items) ? result.items : []);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [active, authReady, isLoggedIn, guestHistoryEpoch, pageKey, typeKey]);

  const items = useMemo(() => {
    const byId = new Map(
      (Array.isArray(allMusic) ? allMusic : []).map((track) => [String(track.id), track])
    );
    const songs = [];
    for (const row of rows) {
      if (!isSong(row)) continue;
      const full = byId.get(String(row.id));
      const song = full && isSong(full) ? full : row;
      if (!isSong(song)) continue;
      songs.push({
        ...song,
        sectionId: SECTION_BY_CATEGORY[song.categoryNameMusic] || 'trend',
      });
    }
    return songs;
  }, [allMusic, rows]);

  return {
    items,
    isLoading: isLoading || (active && musicLoading && items.length === 0),
  };
};
