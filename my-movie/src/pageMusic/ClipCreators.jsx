import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMusicApi } from '../context/MusicApiContext';
import { useActorsApi } from '../context/ActorsApiContext';
import ScrollTouch from '../components/ScrollTouch/ScrollTouch';
import SkeletonLoader from '../components/SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../utils/useImageReady';
import { normalizeImagePath } from '../utils/utils';
import { artistIdsOf } from './useArtistCycle';
import '../components/MovieDetail/MovieDetail.css';

const personName = (value) => {
  if (typeof value === 'string') return value.trim();
  return String(value?.uz || value?.ru || '').trim();
};

const CreatorItem = ({ person, onOpen }) => {
  const imgSrc = person.image ? normalizeImagePath(person.image) : '';
  const img = useImageReady(imgSrc);
  const showSkeleton = Boolean(imgSrc) && img.showSkeleton;

  return (
    <div
      className={`movie-detail-actor-item${showSkeleton ? ' movie-detail-actor-item--loading' : ''}`}
      onClick={() => !showSkeleton && onOpen(person.route)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (showSkeleton) return;
        if (event.key === 'Enter') onOpen(person.route);
      }}
      aria-busy={showSkeleton || undefined}
    >
      <div className={`movie-detail-actor-image${showSkeleton ? ' movie-detail-actor-image--loading' : ''}`}>
        {showSkeleton && (
          <SkeletonLoader
            variant="movie-detail-actor-img"
            className="movie-detail-actor-image-skeleton"
          />
        )}
        {imgSrc ? (
          <img
            ref={img.imgRef}
            src={imgSrc}
            alt={person.name}
            className={showSkeleton ? 'movie-detail-actor-img--loading' : undefined}
            onLoad={img.onLoad}
            onError={img.onError}
          />
        ) : null}
      </div>
      <div className="movie-detail-actor-info">
        <span className={`movie-detail-actor-name${showSkeleton ? ' movie-detail-actor-name--loading' : ''}`}>
          {showSkeleton ? (
            <SkeletonLoader
              variant="movie-detail-actor-name"
              className="movie-detail-actor-name-skeleton"
            />
          ) : (
            <>
              {person.name}
              <img src="/img/galichka2.png" alt="" className="movie-detail-actor-name-verified" />
            </>
          )}
        </span>
        <span className={`actors-page-movies-title${showSkeleton ? ' actors-page-movies-title--loading' : ''}`}>
          {showSkeleton ? (
            <SkeletonLoader
              variant="movie-detail-actor-movies"
              className="movie-detail-actor-movies-title-skeleton"
            />
          ) : (
            person.role
          )}
        </span>
      </div>
    </div>
  );
};

const CreatorSkeleton = () => (
  <div className="movie-detail-actor-item movie-detail-actor-item--loading movie-detail-actor-item--skeleton" aria-hidden="true">
    <div className="movie-detail-actor-image movie-detail-actor-image--loading">
      <SkeletonLoader variant="movie-detail-actor-img" className="movie-detail-actor-image-skeleton" />
    </div>
    <div className="movie-detail-actor-info">
      <span className="movie-detail-actor-name movie-detail-actor-name--loading">
        <SkeletonLoader variant="movie-detail-actor-name" className="movie-detail-actor-name-skeleton" />
      </span>
      <span className="actors-page-movies-title actors-page-movies-title--loading">
        <SkeletonLoader variant="movie-detail-actor-movies" className="movie-detail-actor-movies-title-skeleton" />
      </span>
    </div>
  </div>
);

const ClipCreators = ({ video }) => {
  const navigate = useNavigate();
  const { getArtistById, artistsLoading } = useMusicApi();
  const { getActorById, actorsLoading } = useActorsApi();

  const people = useMemo(() => {
    const artistIds = artistIdsOf(video?.artistId);
    const actorIds = Array.isArray(video?.actors)
      ? video.actors.filter((id) => id != null && String(id).trim() !== '')
      : [];

    const artists = artistIds.map((id) => {
      const artist = getArtistById(id);
      const name = personName(artist?.name);
      if (!artist || !name) return null;
      return {
        key: `artist-${artist.id}`,
        name,
        image: artist.imgArtist || artist.img || '',
        role: 'Music artist',
        route: `/music/artist/${artist.id}`,
      };
    }).filter(Boolean);

    const actors = actorIds.map((id) => {
      const actor = getActorById(id);
      const name = personName(actor?.name);
      if (!actor || !name) return null;
      return {
        key: `actor-${actor.id}`,
        name,
        image: actor.image || '',
        role: 'Movie actor',
        route: `/actor/${actor.id}`,
      };
    }).filter(Boolean);

    return [...artists, ...actors];
  }, [video, getActorById, getArtistById]);

  const artistIds = artistIdsOf(video?.artistId);
  const actorIds = Array.isArray(video?.actors)
    ? video.actors.filter((id) => id != null && String(id).trim() !== '')
    : [];
  const loading = (artistIds.length > 0 && artistsLoading) || (actorIds.length > 0 && actorsLoading);

  if (!video) return null;
  if (!loading && people.length === 0) return null;

  const skeletonCount = Math.max(artistIds.length + actorIds.length, 1);

  return (
    <div className="movie-detail-actors video-detail-creators">
      <h3 className="movie-detail-actors-title">Ijodkorlar</h3>
      <div className="movie-detail-actors-scroll">
        <ScrollTouch className="movie-detail-actors-scroll-inner">
          <div className="movie-detail-actors-grid">
            {loading
              ? Array.from({ length: skeletonCount }, (_, index) => (
                <CreatorSkeleton key={`creator-sk-${index}`} />
              ))
              : people.map((person) => (
                <CreatorItem
                  key={person.key}
                  person={person}
                  onOpen={(route) => navigate(route)}
                />
              ))}
          </div>
        </ScrollTouch>
      </div>
    </div>
  );
};

export default ClipCreators;
