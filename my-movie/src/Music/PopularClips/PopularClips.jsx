import React, { useMemo } from 'react';
import ClipsCards from '../ClipsCards/ClipsCards';
import { useMusicApi } from '../../context/MusicApiContext';
import { usePopularClips } from '../../hooks/usePopularClips';

const POPULAR_CLIPS_SECTION = {
  id: 'popular-clips',
  titleKey: 'music.mashhurKliplar',
  titleDefault: 'Mashhur kliplar',
  moreTo: '/music/more/popular-clips',
  wishlistType: 'klip',
  initialCount: 10,
};

/**
 * Mashhur kliplar — thin product wrapper.
 * Home: 10 ta + more. Full list: MusicMorePage.
 * UI: ClipsCards — oddiy klip kartochka, rank PNG yo‘q.
 */
const PopularClips = () => {
  const { items, loading } = usePopularClips();
  const { allClips, clipsLoading } = useMusicApi();

  const displayClips = useMemo(() => {
    const byId = new Map((allClips || []).map((clip) => [String(clip.id), clip]));
    const out = [];
    for (const row of items) {
      const clip = byId.get(String(row.contentId));
      if (!clip) continue;
      out.push(clip);
    }
    return out;
  }, [allClips, items]);

  const waiting =
    loading || (items.length > 0 && clipsLoading && displayClips.length === 0);

  if (!waiting && displayClips.length === 0) return null;

  return (
    <ClipsCards
      section={{
        ...POPULAR_CLIPS_SECTION,
        data: waiting ? [] : displayClips,
      }}
      isLoading={waiting}
    />
  );
};

export default PopularClips;
