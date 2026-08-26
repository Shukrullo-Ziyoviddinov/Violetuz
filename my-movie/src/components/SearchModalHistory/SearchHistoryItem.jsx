import React, { useEffect, useMemo, useState } from 'react';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import './SearchHistoryItem.css';

/** Media tip → img-blok ichidagi fit */
export const HISTORY_MEDIA_FIT = Object.freeze({
  movie: 'poster',
  music: 'poster',
  klip: 'wide',
  konsert: 'wide',
  actor: 'avatar',
  artist: 'avatar',
});

const PERSON_TYPES = new Set(['actor', 'artist']);

/** Kesh hit bo‘lsa ham actor/artist skeleton ko‘rinsin */
const PERSON_SKELETON_MIN_MS = 240;

/**
 * Snapshot / item dan title.
 * @param {object|null} snapshot
 * @param {string} contentLang
 * @param {string} [type]
 */
export const getHistoryItemTitle = (snapshot, contentLang = 'uz', type = '') => {
  if (!snapshot) return '';

  const name = snapshot.name;
  if (name != null) {
    if (typeof name === 'string') return name;
    if (typeof name === 'object') {
      return (
        name[contentLang] || name.uz || name.ru || name.en || Object.values(name)[0] || ''
      );
    }
  }

  if (type === 'actor' || type === 'artist') return '';

  const title = snapshot.title;
  if (!title) return '';
  if (typeof title === 'object') {
    return (
      title[contentLang] || title.uz || title.ru || title.en || Object.values(title)[0] || ''
    );
  }
  return String(title);
};

/**
 * Snapshot dan rasm URL.
 */
export const getHistoryItemImgSrc = (snapshot, type, contentLang = 'uz') => {
  if (!snapshot) return '';
  if (type === 'movie') {
    const home = snapshot.homeImg;
    if (home && typeof home === 'object') {
      return home[contentLang] || home.uz || home.ru || '';
    }
    return home || snapshot.img || '';
  }
  if (type === 'actor') {
    return snapshot.image || snapshot.img || '';
  }
  if (type === 'artist') {
    return snapshot.imgArtist || snapshot.img || '';
  }
  return snapshot.imgArtist || snapshot.img || '';
};

/**
 * Qidiruv tarixi kartochkasi.
 * Actor/artist: dumaloq avatar, name o‘ngida galochka, meta yonida.
 */
const SearchHistoryItem = ({
  type = 'movie',
  title,
  typeLabel,
  imgSrc,
  onClick,
  forceLoading = false,
  placeholder = false,
}) => {
  const src = forceLoading || placeholder ? '' : imgSrc || '';
  const fit = HISTORY_MEDIA_FIT[type] || 'poster';
  const isPerson = PERSON_TYPES.has(type);
  const verifiedSrc =
    type === 'actor' ? '/img/galichka2.png' : type === 'artist' ? '/img/galichka.png' : '';

  const { showSkeleton: imageSkeleton, imgRef, onLoad, onError, failed } =
    useImageReady(src);

  /** Actor/artist: keshdan kelganda ham skeleton bir zum ko‘rinsin */
  const [personHold, setPersonHold] = useState(
    () => isPerson && !forceLoading && !placeholder
  );

  useEffect(() => {
    if (!isPerson || forceLoading || placeholder) {
      setPersonHold(false);
      return undefined;
    }
    setPersonHold(true);
    const id = window.setTimeout(() => setPersonHold(false), PERSON_SKELETON_MIN_MS);
    return () => window.clearTimeout(id);
  }, [isPerson, src, forceLoading, placeholder, type]);

  const showSkeleton = Boolean(
    forceLoading || placeholder || imageSkeleton || (isPerson && personHold)
  );

  const itemClass = useMemo(
    () =>
      [
        'search-history-item',
        placeholder
          ? 'search-history-item--placeholder'
          : `search-history-item--${type}`,
        !placeholder && `search-history-item--${fit}`,
        showSkeleton && 'search-history-item--loading',
      ]
        .filter(Boolean)
        .join(' '),
    [placeholder, type, fit, showSkeleton]
  );

  return (
    <div
      className={itemClass}
      onClick={() => !showSkeleton && onClick?.()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (showSkeleton) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-busy={showSkeleton || undefined}
    >
      <div className="search-history-item-media">
        {showSkeleton && (
          <SkeletonLoader
            variant="search-history-item-image"
            className="search-history-item-media-skeleton"
          />
        )}
        {!forceLoading && !placeholder && !failed && src && (
          <img
            ref={imgRef}
            src={src}
            alt={title || ''}
            className={`search-history-item-img${
              showSkeleton ? ' search-history-item-img--loading' : ''
            }`}
            onLoad={onLoad}
            onError={onError}
          />
        )}
      </div>

      <div className="search-history-item-text" aria-hidden={showSkeleton || undefined}>
        {showSkeleton ? (
          <>
            <span className="search-history-item-title search-history-item-title--loading">
              <SkeletonLoader
                variant="search-history-item-title"
                className="search-history-item-title-skeleton"
              />
            </span>
            <span className="search-history-item-type search-history-item-type--loading">
              <SkeletonLoader
                variant="search-history-item-type"
                className="search-history-item-type-skeleton"
              />
            </span>
          </>
        ) : (
          <>
            {title ? (
              <span className="search-history-item-title">
                <span className="search-history-item-title-text">{title}</span>
                {isPerson && verifiedSrc ? (
                  <img
                    src={verifiedSrc}
                    alt=""
                    className="search-history-item-verified"
                    aria-hidden="true"
                  />
                ) : null}
              </span>
            ) : null}
            {typeLabel ? <span className="search-history-item-type">{typeLabel}</span> : null}
          </>
        )}
      </div>

      <span className="search-history-item-clock" aria-hidden="true">
        {showSkeleton ? (
          <SkeletonLoader
            variant="block"
            className="search-history-item-clock--loading"
          />
        ) : (
          <i className="fa-solid fa-clock-rotate-left" />
        )}
      </span>
    </div>
  );
};

export default SearchHistoryItem;
