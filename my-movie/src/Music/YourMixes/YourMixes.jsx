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

const isClipMix = (mix) => {
  const type = String(mix?.contentType || 'music').trim().toLowerCase();
  return type === 'klip' || type === 'clip';
};

const YourMixes = () => {
  const { t } = useTranslation();
  const { allMusic, allClips, musicLoading, clipsLoading } = useMusicApi();
  const { mixes, isLoading } = useMusicMixes();

  const cards = useMemo(() => {
    const musicById = new Map((allMusic || []).map((track) => [String(track.id), track]));
    const clipById = new Map((allClips || []).map((clip) => [String(clip.id), clip]));
    return (mixes || []).map((mix) => {
      const byId = isClipMix(mix) ? clipById : musicById;
      const covers = [];
      for (const row of mix.tracks || []) {
        if (covers.length >= COVER_LIMIT) break;
        const src = byId.get(String(row.contentId))?.img || '';
        if (src && !covers.includes(src)) covers.push(src);
      }
      return { mix, covers };
    });
  }, [allClips, allMusic, mixes]);

  const coversStillLoading = cards.some(({ mix, covers }) => {
    if (covers.length > 0 || !(mix?.tracks || []).length) return false;
    return isClipMix(mix) ? clipsLoading : musicLoading;
  });
  const waiting = (isLoading && cards.length === 0) || (coversStillLoading && cards.every((card) => card.covers.length === 0));
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
                  <YourMixCard
                    key={`${mix.contentType || 'music'}-${mix.genre}`}
                    mix={mix}
                    covers={covers}
                  />
                ))}
          </HorizontalScroll>
        </div>
      </div>
    </div>
  );
};

export default YourMixes;
