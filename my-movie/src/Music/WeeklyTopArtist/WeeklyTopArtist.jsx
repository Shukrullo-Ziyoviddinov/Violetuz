import React from 'react';
import { useTranslation } from 'react-i18next';
import { useWeeklyTopArtists } from '../../hooks/useWeeklyTopArtists';
import { topRankSrc } from '../../utils/topRankPreview';
import TopArtistsCarousel from '../TopArtistsCarousel/TopArtistsCarousel';

/**
 * Haftaning Top-10 artistlari — thin product wrapper.
 * UI: TopArtistsCarousel. Data: useWeeklyTopArtists.
 */
const WeeklyTopArtist = () => {
  const { t } = useTranslation();
  const { items, loading } = useWeeklyTopArtists(10);

  return (
    <TopArtistsCarousel
      title={t('music.haftaningTopArtistlari', 'Haftaning top 10 artistlari')}
      items={items}
      loading={loading}
      rankSrc={topRankSrc}
      skeletonKey="weekly-top-artist"
    />
  );
};

export default WeeklyTopArtist;
