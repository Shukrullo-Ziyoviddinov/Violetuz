import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMusicApi } from '../../context/MusicApiContext';
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';
import { mixSectionLabel } from './mixSectionLabel';
import './YourMixes.css';

const COVER_LIMIT = 4;

export const YourMixCard = ({ mix, covers }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { allMusic, sections } = useMusicApi();
  const images = (covers || []).slice(0, COVER_LIMIT);
  const count = Array.isArray(mix?.tracks) ? mix.tracks.length : 0;
  const genre = mixSectionLabel({
    genre: mix?.genre,
    tracks: mix?.tracks,
    allMusic,
    sections,
    t,
  });
  const leadId = mix?.tracks?.[0]?.contentId;

  const open = () => {
    if (!leadId) return;
    const params = new URLSearchParams();
    if (mix?.genre) params.set('mix', mix.genre);
    const query = params.toString();
    navigate(`/music/${leadId}${query ? `?${query}` : ''}`);
  };

  return (
    <button type="button" className="your-mixes-card" onClick={open}>
      <div className={`your-mixes-cover your-mixes-cover--${Math.max(images.length, 1)}`}>
        {images.map((src) => (
          <img key={src} src={src} alt="" />
        ))}
      </div>
      <p className="your-mixes-genre">
        {t('music.mixGenreLine', {
          genre,
          defaultValue: '{{genre}} janerdagi mixlar',
        })}
      </p>
      <p className="your-mixes-count">
        {t('music.mixTrackCount', {
          count,
          defaultValue: '{{count}} ta musiqa',
        })}
      </p>
    </button>
  );
};

export const YourMixCardSkeleton = () => (
  <div className="your-mixes-card your-mixes-card--skeleton" aria-hidden="true">
    <div className="your-mixes-cover">
      <SkeletonLoader variant="music-cards-image" className="music-cards-item-image-skeleton" />
    </div>
    <SkeletonLoader variant="music-cards-item-title" />
    <SkeletonLoader variant="music-cards-item-artist" />
  </div>
);
