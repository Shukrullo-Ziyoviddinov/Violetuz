import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMusicApi } from '../../context/MusicApiContext';
import { useMusicMixes } from '../../hooks/useMusicMixes';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';
import { YourMixCard, YourMixCardSkeleton } from './YourMixCard';
import '../MusicCards/MusicCards.css';
import './YourMixes.css';

const SKELETON_COUNT = 4;
const COVER_LIMIT = 4;

const YourMixes = () => {
  const { t } = useTranslation();
  const { allMusic, musicLoading } = useMusicApi();
  const { mixes, isLoading } = useMusicMixes();

  const cards = useMemo(() => {
    const byId = new Map((allMusic || []).map((track) => [String(track.id), track]));
    return (mixes || []).map((mix) => {
      const covers = [];
      for (const row of mix.tracks || []) {
        if (covers.length >= COVER_LIMIT) break;
        const track = byId.get(String(row.contentId));
        const src = track?.img || '';
        if (src && !covers.includes(src)) covers.push(src);
      }
      return { mix, covers };
    });
  }, [allMusic, mixes]);

  const waiting = (isLoading || musicLoading) && cards.length === 0;
  if (!waiting && cards.length === 0) return null;

  return (
    <div className="music-cards music-cards--your-mixes" aria-busy={waiting || undefined}>
      <div className="music-cards-container">
        <div className="music-cards-header">
          {waiting ? (
            <SkeletonLoader variant="music-cards-title" className="music-cards-title-skeleton" />
          ) : (
            <h2 className="music-cards-title">
              <span className="music-cards-title-text">
                {t('music.yourMixes', 'Sizning mixlaringiz')}
              </span>
            </h2>
          )}
        </div>
        <div className="music-cards-content">
          <HorizontalScroll>
            {waiting
              ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
                  <YourMixCardSkeleton key={`your-mix-skel-${index}`} />
                ))
              : cards.map(({ mix, covers }) => (
                  <YourMixCard key={mix.genre} mix={mix} covers={covers} />
                ))}
          </HorizontalScroll>
        </div>
      </div>
    </div>
  );
};

export default YourMixes;
