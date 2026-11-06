import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTrillerList } from '../../hooks/useTrillerList';
import TrillerCard, { TrillerCardSkeleton } from './TrillerCard';
import '../../pages/RecommendedPage.css';
import './TrillerSection.css';
import './TrillerRecommendedPage.css';

export default function TrillerRecommendedPage() {
  const { t } = useTranslation();
  const { data: list = [], isPending, isError, isFetching, refetch } = useTrillerList();
  return <div className="recommended-page triller-recommended-page">
    <div className="triller-section-container">
      <h1 className="triller-section-title">Parda ortida</h1>
      <div className="triller-recommended-grid" aria-busy={isPending || undefined}>
        {isPending ? Array.from({ length: 10 }, (_, index) => <TrillerCardSkeleton key={index} />)
          : list.map((item) => <TrillerCard key={item.id} triller={item} />)}
      </div>
      {!isPending && !isError && !list.length && <p>{t('trillerRecommendations.empty', { defaultValue: 'Hozircha videolar yo‘q.' })}</p>}
      {isError && <div role="alert">
        <p>{t('trillerRecommendations.error', { defaultValue: 'Videolarni yuklab bo‘lmadi.' })}</p>
        <button type="button" onClick={() => refetch()} disabled={isFetching}>
          {t('trillerRecommendations.retry', { defaultValue: 'Qayta urinish' })}
        </button>
      </div>}
    </div>
  </div>;
}
