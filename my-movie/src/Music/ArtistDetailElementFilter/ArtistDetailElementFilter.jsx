import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ScrollTouch from '../../components/ScrollTouch/ScrollTouch';
import './ArtistDetailElementFilter.css';

const FILTER_ALL = 'all';
const FILTER_MUSIC = 'music';
const FILTER_ALBUM = 'album';
const FILTER_KLIP = 'klip';
const FILTER_SHORTS = 'shorts';
const FILTER_KONSERT = 'konsert';
const FILTER_MOVIES = 'movies';

const iconSize = 18;

const FilterIcons = {
  [FILTER_ALL]: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  [FILTER_MUSIC]: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  [FILTER_ALBUM]: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  [FILTER_KLIP]: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  [FILTER_SHORTS]: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="2" width="10" height="20" rx="2" ry="2" />
      <polygon points="11 8 15 12 11 16" fill="currentColor" stroke="none" />
    </svg>
  ),
  [FILTER_KONSERT]: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  [FILTER_MOVIES]: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
      <line x1="7" y1="4" x2="7" y2="20" />
      <line x1="17" y1="4" x2="17" y2="20" />
    </svg>
  ),
};

/**
 * ArtistDetail sahifasidagi bo'limlar uchun filter komponenti.
 * All, Musiqalar, Albomlar, Kliplar, Konsertlar tugmalari orqali kontentni filterlash.
 */
const ArtistDetailElementFilter = ({
  hasMusic = false,
  hasAlbums = false,
  hasClips = false,
  hasShorts = false,
  hasConcerts = false,
  hasMovies = false,
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  const [internalValue, setInternalValue] = useState(FILTER_ALL);
  const isControlled = value !== undefined && value !== null;
  const effectiveValue = isControlled ? value : internalValue;

  const filterButtons = useMemo(() => {
    const buttons = [
      { id: FILTER_ALL, labelKey: 'artistDetail.filterAll', labelDefault: 'Hammasi', show: true },
      { id: FILTER_MUSIC, labelKey: 'music.tracks', labelDefault: 'Musiqalar', show: hasMusic },
      { id: FILTER_ALBUM, labelKey: 'music.albums', labelDefault: 'Albomlar', show: hasAlbums },
      { id: FILTER_KLIP, labelKey: 'music.clips', labelDefault: 'Kliplar', show: hasClips },
      { id: FILTER_SHORTS, labelKey: 'music.shorts', labelDefault: 'Shorts', show: hasShorts },
      { id: FILTER_KONSERT, labelKey: 'music.concerts', labelDefault: 'Konsertlar', show: hasConcerts },
      { id: FILTER_MOVIES, labelKey: 'movies.movies', labelDefault: 'Kinolar', show: hasMovies },
    ];
    return buttons.filter((b) => b.show);
  }, [hasMusic, hasAlbums, hasClips, hasShorts, hasConcerts, hasMovies]);

  const handleClick = (filterId) => {
    if (isControlled) {
      onChange?.(filterId);
    } else {
      setInternalValue(filterId);
      onChange?.(filterId);
    }
  };

  return (
    <ScrollTouch className="artist-detail-element-filter">
      {filterButtons.map((btn) => (
        <button
          key={btn.id}
          type="button"
          className={`artist-detail-element-filter-btn ${effectiveValue === btn.id ? 'active' : ''}`}
          onClick={() => handleClick(btn.id)}
          aria-pressed={effectiveValue === btn.id}
          aria-label={t(btn.labelKey, btn.labelDefault)}
        >
          <span className="artist-detail-element-filter-btn-icon">{FilterIcons[btn.id]}</span>
          {t(btn.labelKey, btn.labelDefault)}
        </button>
      ))}
    </ScrollTouch>
  );
};

export default ArtistDetailElementFilter;
export { FILTER_ALL, FILTER_MUSIC, FILTER_ALBUM, FILTER_KLIP, FILTER_SHORTS, FILTER_KONSERT, FILTER_MOVIES };
