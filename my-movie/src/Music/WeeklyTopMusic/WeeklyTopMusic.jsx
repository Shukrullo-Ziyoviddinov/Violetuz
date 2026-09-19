import React from 'react';
import { useTranslation } from 'react-i18next';
import { useWeeklyTopMusic } from '../../hooks/useWeeklyTopMusic';
import { topRankSrc } from '../../utils/topRankPreview';
import TopMusicChart from '../TopMusicChart/TopMusicChart';

/**
 * Haftaning top musiqalari — thin product wrapper.
 * UI: TopMusicChart. Data: useWeeklyTopMusic.
 */
const WeeklyTopMusic = () => {
  const { t } = useTranslation();
  const { items, loading } = useWeeklyTopMusic();

  return (
    <TopMusicChart
      items={items}
      loading={loading}
      title={t('music.haftaningTopMusiqalari', 'Haftaning top 10 musiqalari')}
      rankSrc={topRankSrc}
      skeletonKey="weekly-top-music"
    />
  );
};

export default WeeklyTopMusic;
