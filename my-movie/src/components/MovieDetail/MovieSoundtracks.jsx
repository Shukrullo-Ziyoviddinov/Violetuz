import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMusicApi } from '../../context/MusicApiContext';
import { useWishlist } from '../../context/WishlistContext';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../../utils/useImageReady';
import './MovieSoundtracks.css';

const soundtrackIds = (movie) => {
  const list = movie?.movieSauntrik;
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const ids = [];
  for (const raw of list) {
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
};

const trackTitle = (track) => {
  const title = track?.title;
  if (title == null) return '';
  if (typeof title === 'object') return title.uz || title.ru || title.en || '';
  return String(title);
};

const SoundtrackCard = ({ track, artistName, onOpen }) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const imgSrc = typeof track.img === 'string' ? track.img : '';
  const { imgRef, onLoad, onError, failed } = useImageReady(imgSrc);
  const saved = isInWishlist(track.id, 'music');

  const open = () => onOpen(track.id);

  const onSave = (event) => {
    event.stopPropagation();
    toggleWishlist(track.id, 'music');
  };

  return (
    <div className="movie-soundtrack-card" onClick={open} role="link" tabIndex={0} onKeyDown={(event) => {
      if (event.key === 'Enter') open();
    }}>
      <div className="movie-soundtrack-cover">
        {!failed && imgSrc ? (
          <img ref={imgRef} src={imgSrc} alt="" onLoad={onLoad} onError={onError} />
        ) : null}
        <button
          type="button"
          className={`movie-soundtrack-save${saved ? ' is-saved' : ''}`}
          onClick={onSave}
          aria-label="Saqlash"
          aria-pressed={saved}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <span className="movie-soundtrack-play" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21" />
          </svg>
        </span>
        <div className="movie-soundtrack-info">
          <div className="movie-soundtrack-title">{trackTitle(track)}</div>
          {artistName ? <div className="movie-soundtrack-artist">{artistName}</div> : null}
        </div>
      </div>
    </div>
  );
};

/**
 * Kino saundtreklari. movieSauntrik dagi id larni musiqa katalogidan o‘qiydi.
 * Tartib massiv tartibi. Algoritm yo‘q.
 */
const SoundtrackCardSkeleton = () => (
  <div className="movie-soundtrack-card movie-soundtrack-card--skeleton" aria-hidden="true">
    <div className="movie-soundtrack-cover">
      <SkeletonLoader variant="movie-soundtrack-cover" />
      <span className="movie-soundtrack-save movie-soundtrack-save--skeleton">
        <SkeletonLoader variant="movie-soundtrack-save" />
      </span>
      <span className="movie-soundtrack-play movie-soundtrack-play--skeleton">
        <SkeletonLoader variant="movie-soundtrack-play" />
      </span>
      <div className="movie-soundtrack-info">
        <SkeletonLoader variant="movie-soundtrack-title" />
        <SkeletonLoader variant="movie-soundtrack-artist" />
      </div>
    </div>
  </div>
);

const MovieSoundtracks = ({ movie, title }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getMusicByIdLocal, getArtistById, musicLoading } = useMusicApi();
  const ids = useMemo(() => soundtrackIds(movie), [movie]);
  const tracks = useMemo(
    () => ids.map((id) => getMusicByIdLocal(id)).filter(Boolean),
    [ids, getMusicByIdLocal]
  );
  const showSkeleton = ids.length > 0 && tracks.length === 0 && musicLoading;

  if (!showSkeleton && tracks.length === 0) return null;

  const heading = title || t('detail.movieSoundtracks', 'Saundtrek');
  const openTrack = (id) => navigate(`/music/${id}`);

  if (showSkeleton) {
    return (
      <section className="movie-soundtracks movie-soundtracks--skeleton" aria-busy="true" aria-label={heading}>
        <h2 className="movie-soundtracks-title movie-soundtracks-title--skeleton">
          <SkeletonLoader variant="movie-soundtrack-section-title" />
        </h2>
        <HorizontalScroll>
          {ids.map((id) => (
            <SoundtrackCardSkeleton key={id} />
          ))}
        </HorizontalScroll>
      </section>
    );
  }

  return (
    <section className="movie-soundtracks" aria-label={heading}>
      <h2 className="movie-soundtracks-title">{heading}</h2>
      <HorizontalScroll>
        {tracks.map((track) => (
          <SoundtrackCard
            key={track.id}
            track={track}
            artistName={getArtistById(track.artistId)?.name || ''}
            onOpen={openTrack}
          />
        ))}
      </HorizontalScroll>
    </section>
  );
};

export default MovieSoundtracks;
