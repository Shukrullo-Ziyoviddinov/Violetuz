import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTopArtists } from '../../hooks/useTopArtists';
import { topRankSrc } from '../../utils/topRankPreview';
import TopArtistsCarousel from '../TopArtistsCarousel/TopArtistsCarousel';

/**
 * Global Top-10 artists — thin product wrapper.
 * UI: TopArtistsCarousel. Data: useTopArtists.
 */
const TopArtist = () => {
  const { t } = useTranslation();
  const { items, loading } = useTopArtists(10);

  return (
    <TopArtistsCarousel
      title={t('music.topArtistlar', 'Top 10 artistlar')}
      items={items}
      loading={loading}
      rankSrc={topRankSrc}
      skeletonKey="top-artist"
    />
  );
};

export default TopArtist;
