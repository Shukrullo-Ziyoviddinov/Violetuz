import React from 'react';
import { useTranslation } from 'react-i18next';
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';

/**
 * Desktop: mix qatori o'ng bo'lim blokining ustida.
 * Ko'rinish va scroll shu blok bilan bir xil.
 */
const MusicDetailMixList = ({ label, busy, children }) => {
  const { t } = useTranslation();
  const title = t('music.mixGenreLine', {
    genre: label,
    defaultValue: '{{genre}} janerdagi mixlar',
  });

  return (
    <div className="music-detail-right-scroll music-detail-mix-scroll">
      {busy ? (
        <SkeletonLoader
          variant="music-detail-trend-title"
          className="music-detail-trend-title-skeleton"
        />
      ) : (
        <h3 className="music-detail-trend-title">{title}</h3>
      )}
      <div className="music-detail-trend-grid" aria-busy={busy || undefined}>
        {children}
      </div>
    </div>
  );
};

export default MusicDetailMixList;
