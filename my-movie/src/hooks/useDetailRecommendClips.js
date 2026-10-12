import { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectAuthReady, selectIsLoggedIn } from '../store/slices/userSlice';
import { fetchViewerDetailClips } from '../api/detailRecommendApi';
import { useMusicApi } from '../context/MusicApiContext';
import { getListenHistory } from '../utils/localStorage/guestHistory/musicGuestHistory';
import { GUEST_MUSIC_HISTORY_CHANGED } from '../utils/localStorage/guestHistory/events';

const SECTION_BY_CATEGORY = {
  trendClipsData: 'trend-clips',
  visualBeatsData: 'visual-beats',
  loveAndDesireData: 'sevgi-va-ichq',
  trendVideosData: 'trend-videos',
  stageCreationData: 'sahnadagi-ijod',
  liveStagesData: 'live-stages',
};

const isMusicOrAlbumPage = (pageType) => {
  const type = String(pageType || '').trim().toLowerCase();
  return type === 'music' || type === 'musicalbom' || type === 'album' || type === 'music_album';
};

const isClip = (row) => {
  const type = String(row?.type || '').trim().toLowerCase();
  return type === 'klip' || type === 'clip';
};

/**
 * Musiqa va albom "Tavsiya etilgan kliplar". Natija faqat klip.
 * Konsert bu qatorga kirmaydi. useRecommendedClips ga ulanmaydi.
 *
 * @param {{ enabled?: boolean, pageType?: string, pageId?: string|number }} [opts]
 */
export function useDetailRecommendClips({ enabled = true, pageType, pageId } = {}) {
  const authReady = useAppSelector(selectAuthReady);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const { allClips, clipsLoading } = useMusicApi();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [guestHistoryEpoch, setGuestHistoryEpoch] = useState(0);

  const pageKey = String(pageId ?? '').trim();
  const typeKey = String(pageType || '').trim();
  const active = Boolean(enabled && isMusicOrAlbumPage(typeKey) && pageKey);

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

    fetchViewerDetailClips({
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
      (Array.isArray(allClips) ? allClips : [])
        .filter(isClip)
        .map((clip) => [String(clip.id), clip])
    );
    const clips = [];
    for (const row of rows) {
      if (!isClip(row)) continue;
      const full = byId.get(String(row.id));
      const clip = full && isClip(full) ? full : row;
      if (!isClip(clip)) continue;
      clips.push({
        ...clip,
        sectionId: SECTION_BY_CATEGORY[clip.categoryNameMusic] || 'trend-clips',
      });
    }
    return clips;
  }, [allClips, rows]);

  return {
    items,
    isLoading: isLoading || (active && clipsLoading && items.length === 0),
  };
};
