import React, { useMemo } from 'react';
import MusicCards from '../MusicCards/MusicCards';
import { useMusicApi } from '../../context/MusicApiContext';
import { useWeeklyTopMusic } from '../../hooks/useWeeklyTopMusic';
import { topRankSrc } from '../../utils/topRankPreview';

const WEEKLY_TOP_MUSIC_SECTION = {
  id: 'weekly-top-music',
  titleKey: 'music.haftaningTopMusiqalari',
  titleDefault: 'Haftaning top 10 musiqalari',
  wishlistType: 'music',
  initialCount: 10,
};

/**
 * Haftaning top musiqalari.
 * Tartib hook/serverdan. Bo‘sh bo‘lsa blok chiqmaydi.
 * Artist WeeklyTopArtist dan alohida.
 */
const WeeklyTopMusic = () => {
  const { items, loading } = useWeeklyTopMusic();
  const { allMusic, musicLoading } = useMusicApi();

  const displayItems = useMemo(() => {
    const byId = new Map((allMusic || []).map((track) => [String(track.id), track]));
    const out = [];
    for (const row of items) {
      const track = byId.get(String(row.contentId));
      if (!track) continue;
      const rank = Number(row.rank) || out.length + 1;
      out.push({
        ...track,
        weeklyRankSrc: topRankSrc(rank),
      });
    }
    return out;
  }, [allMusic, items]);

  const waiting =
    loading || (items.length > 0 && musicLoading && displayItems.length === 0);

  if (!waiting && displayItems.length === 0) return null;

  return (
    <MusicCards
      section={WEEKLY_TOP_MUSIC_SECTION}
      items={waiting ? [] : displayItems}
      isLoading={waiting}
    />
  );
};

export default WeeklyTopMusic;
