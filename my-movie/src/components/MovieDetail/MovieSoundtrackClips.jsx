import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMusicApi } from '../../context/MusicApiContext';
import { useWishlist } from '../../context/WishlistContext';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import { useImageReady } from '../../utils/useImageReady';
import './MovieSoundtrackClips.css';

const clipIds = (movie) => {
  const list = movie?.movieSauntrikVideo;
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

const clipTitle = (clip) => {
  const title = clip?.title;
  if (title == null) return '';
  if (typeof title === 'object') return title.uz || title.ru || title.en || '';
  return String(title);
};

const SoundtrackClipCard = ({ clip, artistName, onOpen }) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const imgSrc = typeof clip.img === 'string' ? clip.img : '';
  const { imgRef, onLoad, onError, failed } = useImageReady(imgSrc);
  const saved = isInWishlist(clip.id, 'klip');

  const open = () => onOpen(clip.id);

  const onSave = (event) => {
    event.stopPropagation();
    toggleWishlist(clip.id, 'klip');
  };

  return (
    <div
      className="movie-soundtrack-clip-card"
      onClick={open}
      role="link"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter') open();
      }}
    >
      <div className="movie-soundtrack-clip-cover">
        {!failed && imgSrc ? (
          <img ref={imgRef} src={imgSrc} alt="" onLoad={onLoad} onError={onError} />
        ) : null}
        <button
          type="button"
          className={`movie-soundtrack-clip-save${saved ? ' is-saved' : ''}`}
          onClick={onSave}
          aria-label="Saqlash"
          aria-pressed={saved}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <span className="movie-soundtrack-clip-play" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21" />
          </svg>
        </span>
        <div className="movie-soundtrack-clip-info">
          <div className="movie-soundtrack-clip-title">{clipTitle(clip)}</div>
          {artistName ? <div className="movie-soundtrack-clip-artist">{artistName}</div> : null}
        </div>
      </div>
    </div>
  );
};

/**
 * Kino kliplari. movieSauntrikVideo dagi id larni klip katalogidan o‘qiydi.
 * Tartib massiv tartibi. Algoritm yo‘q.
 */
const MovieSoundtrackClips = ({ movie, title }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getClipByIdLocal, getArtistById } = useMusicApi();
  const clips = useMemo(
    () => clipIds(movie).map((id) => getClipByIdLocal(id)).filter(Boolean),
    [movie, getClipByIdLocal]
  );

  if (clips.length === 0) return null;

  const heading = title || t('detail.movieSoundtrackClips', 'Saundtrek video va kliplar');
  const openClip = (id) => navigate(`/music/video/${id}`);

  return (
    <section className="movie-soundtrack-clips" aria-label={heading}>
      <h2 className="movie-soundtrack-clips-title">{heading}</h2>
      <HorizontalScroll>
        {clips.map((clip) => (
          <SoundtrackClipCard
            key={clip.id}
            clip={clip}
            artistName={getArtistById(clip.artistId)?.name || ''}
            onOpen={openClip}
          />
        ))}
      </HorizontalScroll>
    </section>
  );
};

export default MovieSoundtrackClips;
