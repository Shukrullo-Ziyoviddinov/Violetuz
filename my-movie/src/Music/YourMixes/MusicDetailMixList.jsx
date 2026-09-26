import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';
import MusicMixControls from './MusicMixControls';
import './MusicDetailMixList.css';

/**
 * Desktop: mix qatori o'ng bo'lim blokining ustida.
 * X bosilsa shu joyda yig'iladi, qayta bossangiz pastga ochiladi.
 */
const MusicDetailMixList = ({
  label,
  busy,
  dominantColor,
  repeat,
  shuffle,
  onToggleRepeat,
  onToggleShuffle,
  children,
}) => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const title = t('music.mixGenreLine', {
    genre: label,
    defaultValue: '{{genre}} janerdagi mixlar',
  });
  const colorStyle = dominantColor
    ? {
        '--card-dominant-r': dominantColor.r,
        '--card-dominant-g': dominantColor.g,
        '--card-dominant-b': dominantColor.b,
      }
    : undefined;

  return (
    <div
      className={[
        'music-detail-right-scroll',
        'music-detail-mix-scroll',
        collapsed ? 'is-collapsed music-detail-trend-card-active' : '',
      ].filter(Boolean).join(' ')}
      style={colorStyle}
    >
      {busy ? (
        <SkeletonLoader
          variant="music-detail-trend-title"
          className="music-detail-trend-title-skeleton"
        />
      ) : collapsed ? (
        <button
          type="button"
          className="music-detail-mix-collapsed"
          onClick={() => setCollapsed(false)}
          aria-expanded="false"
        >
          <span className="music-detail-trend-title">{title}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
          </svg>
        </button>
      ) : (
        <div className="music-detail-mix-head">
          <h3 className="music-detail-trend-title">{title}</h3>
          <button
            type="button"
            className="music-detail-mix-close"
            onClick={() => setCollapsed(true)}
            aria-expanded="true"
            aria-label="Yig'ish"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 0 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z"
              />
            </svg>
          </button>
        </div>
      )}
      <div className="music-detail-mix-body">
        <div className="music-detail-mix-body-inner">
          {!busy && (
            <MusicMixControls
              repeat={repeat}
              shuffle={shuffle}
              onToggleRepeat={onToggleRepeat}
              onToggleShuffle={onToggleShuffle}
            />
          )}
          <div className="music-detail-trend-grid" aria-busy={busy || undefined}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicDetailMixList;
