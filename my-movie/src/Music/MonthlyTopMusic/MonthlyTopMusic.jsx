import React from 'react';
import { useTranslation } from 'react-i18next';
import { useMonthlyTopMusic } from '../../hooks/useMonthlyTopMusic';
import { monthlyTopRankSrc } from '../../utils/topRankPreview';
import TopMusicChart from '../TopMusicChart/TopMusicChart';

/**
 * Oyning top musiqalari — thin product wrapper.
 * UI: TopMusicChart. Data: useMonthlyTopMusic.
 */
const MonthlyTopMusic = () => {
  const { t } = useTranslation();
  const { items, loading } = useMonthlyTopMusic();

  return (
    <TopMusicChart
      items={items}
      loading={loading}
      title={t('music.oyningTopMusiqalari', 'Oyning top 10 musiqalari')}
      rankSrc={monthlyTopRankSrc}
      skeletonKey="monthly-top-music"
    />
  );
};

export default MonthlyTopMusic;
