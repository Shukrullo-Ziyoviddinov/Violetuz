import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useActorsApi } from '../context/ActorsApiContext';
import { useMoviesApi } from '../context/MoviesApiContext';
import { useContentLanguage } from '../context/ContentLanguageContext';
import Movies from '../components/Movies/Movies';
import MoreText from '../components/MoreText/MoreText';
import ScrollTouch from '../components/ScrollTouch/ScrollTouch';
import FollowingButton from '../Music/FollowingButton/FollowingButton';
import ImgModal from '../components/ImgModal/ImgModal';
import GlobalModal from '../components/GlobalModal/GlobalModal';
import VideoModal from '../components/VideoModal/VideoModal';
import ShowMoreButton, { getDisplayItems } from '../components/ShowMoreButton/ShowMoreButton';
import ActorAwardsSection, {
  ActorAwardsSectionSkeleton,
} from '../components/ActorAwardsSection/ActorAwardsSection';
import SimilarActors, { SimilarActorsSkeleton } from '../components/SimilarActors/SimilarActors';
import ActorTopRatedKinolar, {
  ActorTopRatedKinolarSkeleton,
} from '../components/ActorTopRatedKinolar/ActorTopRatedKinolar';
import Filters from '../components/Filters';
import SkeletonLoader from '../components/SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../utils/useImageReady';
import { formatCount } from '../utils/utils';
import { primeVideoDraphyThumb } from '../utils/primeVideoDraphyThumb';
import './ActorsPage.css';

const getRatingFilter = (movie, selectedRatingType, selectedRating) => {
  if (selectedRating === null) return true;
  const val = movie[selectedRatingType];
  return val != null && val !== '' && val !== 'none' && (val == selectedRating || Number(val) === Number(selectedRating));
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
};

const MetaIcon = ({ type }) => {
  const size = 16;
  if (type === 'birthDate') {
    return (
      <svg className="actors-page-meta-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    );
  }
  if (type === 'country') {
    return (
      <svg className="actors-page-meta-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    );
  }
  if (type === 'city') {
    return (
      <svg className="actors-page-meta-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-6h6v6" />
      </svg>
    );
  }
  return null;
};

/** Refresh / birinchi yuklash — profile bloklari yo‘qolmasin, px real bilan bir xil */
const ActorsPageProfileSkeleton = () => (
  <div className="actors-page actors-page--skeleton" aria-busy="true">
    <div className="actors-page-header">
      <div className="actors-page-profile actors-page-profile--has-bg actors-page-profile--skeleton">
        <div className="actors-page-image actors-page-image--skeleton">
          <SkeletonLoader
            variant="actors-page-image"
            className="actors-page-image-skeleton"
          />
        </div>
        <div className="actors-page-info">
          <div className="actors-page-name actors-page-name--skeleton">
            <SkeletonLoader
              variant="actors-page-name"
              className="actors-page-name-skeleton"
            />
          </div>
          <div className="actors-page-meta">
            <div className="actors-page-meta-row">
              {[0, 1, 2].map((i) => (
                <span
                  key={`meta-sk-${i}`}
                  className="actors-page-meta-item actors-page-meta-item--skeleton"
                  aria-hidden="true"
                >
                  <SkeletonLoader
                    variant="actors-page-meta-item"
                    className="actors-page-meta-item-skeleton"
                  />
                </span>
              ))}
            </div>
            <div className="actors-page-meta-genres">
              <span
                className="actors-page-meta-genres-label actors-page-meta-genres-label--skeleton"
                aria-hidden="true"
              >
                <SkeletonLoader
                  variant="actors-page-meta-genres-label"
                  className="actors-page-meta-genres-label-skeleton"
                />
              </span>
              <div className="actors-page-meta-genres-list">
                {[0, 1, 2].map((i) => (
                  <span
                    key={`genre-sk-${i}`}
                    className="actors-page-meta-genre-pill actors-page-meta-genre-pill--skeleton"
                    aria-hidden="true"
                  >
                    <SkeletonLoader
                      variant="actors-page-meta-genre-pill"
                      className="actors-page-meta-genre-pill-skeleton"
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="actors-page-subscribe">
            <span
              className="actors-page-subscribers-count actors-page-subscribers-count--skeleton"
              aria-hidden="true"
            >
              <SkeletonLoader
                variant="actors-page-subscribers-count"
                className="actors-page-subscribers-count-skeleton"
              />
            </span>
            <span
              className="actors-page-movies-title actors-page-movies-title--skeleton"
              aria-hidden="true"
            >
              <SkeletonLoader
                variant="actors-page-movies-title"
                className="actors-page-movies-title-skeleton"
              />
            </span>
            <div className="actors-page-follow-btn--desktop">
              <span className="following-btn following-btn--skeleton" aria-hidden="true">
                <SkeletonLoader
                  variant="actors-page-following-btn"
                  className="actors-page-following-btn-skeleton"
                />
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="actors-page-follow-btn--mobile">
        <span className="following-btn following-btn--skeleton" aria-hidden="true">
          <SkeletonLoader
            variant="actors-page-following-btn"
            className="actors-page-following-btn-skeleton"
          />
        </span>
      </div>

      <div className="actors-page-bio actors-page-bio--skeleton" aria-hidden="true">
        <div className="actors-page-bio-inner">
          <div className="actors-page-bio-text">
            <div
              className="actors-page-section-heading actors-page-bio-text-title actors-page-bio-text-title--skeleton"
            >
              <SkeletonLoader
                variant="actors-page-bio-title"
                className="actors-page-bio-text-title-skeleton"
              />
            </div>
            <div className="actors-page-bio-text-body--skeleton">
              <SkeletonLoader
                variant="actors-page-bio-line"
                className="actors-page-bio-line-skeleton"
              />
              <SkeletonLoader
                variant="actors-page-bio-line"
                className="actors-page-bio-line-skeleton actors-page-bio-line-skeleton--short"
              />
              <SkeletonLoader
                variant="actors-page-bio-line"
                className="actors-page-bio-line-skeleton"
              />
            </div>
          </div>
          <div className="actors-page-bio-images">
            <div className="actors-page-bio-grid">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={`bio-grid-sk-${i}`}
                  className="actors-page-bio-grid-item actors-page-bio-grid-item--skeleton"
                >
                  <SkeletonLoader
                    variant="actors-page-bio-grid-item"
                    className="actors-page-bio-grid-item-skeleton"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

      <div className="actors-page-media-wrap actors-page-media-wrap--skeleton" aria-hidden="true">
        <div className="actors-page-media-row actors-page-media-row--split">
          <div className="actors-page-photo-gallery-block actors-page-photo-gallery-block--skeleton">
            <div className="actors-page-photo-gallery-head">
              <div className="actors-page-media-heading actors-page-section-heading actors-page-media-heading--skeleton">
                <SkeletonLoader
                  variant="actors-page-media-heading"
                  className="actors-page-media-heading-skeleton"
                />
              </div>
            </div>
            <div className="actors-page-photo-gallery-grid">
              <div className="actors-page-pg-cell actors-page-pg-cell--hero actors-page-pg-cell--skeleton">
                <SkeletonLoader
                  variant="actors-page-pg-cell"
                  className="actors-page-pg-cell-skeleton"
                />
              </div>
              <div className="actors-page-pg-cell actors-page-pg-cell--mid-top actors-page-pg-cell--skeleton">
                <SkeletonLoader
                  variant="actors-page-pg-cell"
                  className="actors-page-pg-cell-skeleton"
                />
              </div>
              <div className="actors-page-pg-cell actors-page-pg-cell--mid-bottom actors-page-pg-cell--skeleton">
                <SkeletonLoader
                  variant="actors-page-pg-cell"
                  className="actors-page-pg-cell-skeleton"
                />
              </div>
              <div className="actors-page-pg-cell actors-page-pg-cell--right actors-page-pg-cell--skeleton-wrap">
                <div className="actors-page-pg-right-top">
                  <div className="actors-page-pg-cell actors-page-pg-cell--small actors-page-pg-cell--skeleton">
                    <SkeletonLoader
                      variant="actors-page-pg-cell"
                      className="actors-page-pg-cell-skeleton"
                    />
                  </div>
                  <div className="actors-page-pg-cell actors-page-pg-cell--small actors-page-pg-cell--skeleton">
                    <SkeletonLoader
                      variant="actors-page-pg-cell"
                      className="actors-page-pg-cell-skeleton"
                    />
                  </div>
                </div>
                <div className="actors-page-pg-cell actors-page-pg-cell--wide actors-page-pg-cell--skeleton">
                  <SkeletonLoader
                    variant="actors-page-pg-cell"
                    className="actors-page-pg-cell-skeleton"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="actors-page-video-draphy-block actors-page-video-draphy-block--skeleton">
            <div className="actors-page-video-draphy-head">
              <div className="actors-page-media-heading actors-page-section-heading actors-page-media-heading--skeleton actors-page-video-draphy-heading--skeleton">
                <SkeletonLoader
                  variant="actors-page-video-draphy-heading"
                  className="actors-page-video-draphy-heading-skeleton"
                />
              </div>
            </div>
            <div className="actors-page-video-draphy-list">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={`vd-sk-${i}`}
                  className="actors-page-video-draphy-item actors-page-video-draphy-item--modal-trigger actors-page-video-draphy-item--skeleton"
                >
                  <div className="actors-page-video-draphy-video-wrap actors-page-video-draphy-video-wrap--skeleton">
                    <SkeletonLoader
                      variant="actors-page-video-draphy-thumb"
                      className="actors-page-video-draphy-thumb-skeleton"
                    />
                  </div>
                  <div className="actors-page-video-draphy-info">
                    <div className="actors-page-video-draphy-title actors-page-video-draphy-title--skeleton">
                      <SkeletonLoader
                        variant="actors-page-video-draphy-title"
                        className="actors-page-video-draphy-title-skeleton"
                      />
                    </div>
                    <div className="actors-page-video-draphy-duration actors-page-video-draphy-duration--skeleton">
                      <SkeletonLoader
                        variant="actors-page-video-draphy-duration"
                        className="actors-page-video-draphy-duration-skeleton"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="actors-page-extras-wrap actors-page-extras-wrap--skeleton" aria-hidden="true">
        <ActorAwardsSectionSkeleton />
        <SimilarActorsSkeleton />
        <ActorTopRatedKinolarSkeleton />
      </div>

      <div className="actors-page-movies actors-page-movies--skeleton" aria-hidden="true">
        <Filters isLoading />
        <Movies
          sectionType="all"
          limit={null}
          filteredMovies={[]}
          hideHeader
          isLoading
          showHorizontalScroll
        />
      </div>
  </div>
);

const ActorsPagePgCell = ({
  src,
  index,
  className = '',
  onOpen,
}) => {
  const { showSkeleton, imgRef, onLoad, onError } = useImageReady(src || '');

  return (
    <div
      className={`actors-page-pg-cell ${className}${
        showSkeleton ? ' actors-page-pg-cell--loading' : ''
      }`.trim()}
      role="button"
      tabIndex={0}
      aria-busy={showSkeleton || undefined}
      onClick={() => !showSkeleton && onOpen?.(index)}
      onKeyDown={(e) => {
        if (showSkeleton) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen?.(index);
        }
      }}
    >
      {showSkeleton && (
        <SkeletonLoader
          variant="actors-page-pg-cell"
          className="actors-page-pg-cell-skeleton"
        />
      )}
      {src ? (
        <img
          ref={imgRef}
          src={src}
          alt=""
          className={showSkeleton ? 'actors-page-pg-cell-img--loading' : undefined}
          onLoad={onLoad}
          onError={onError}
        />
      ) : null}
    </div>
  );
};

const ActorsPageBioGridItem = ({ src, alt, index, onOpen }) => {
  const { showSkeleton, imgRef, onLoad, onError } = useImageReady(src || '');

  return (
    <div
      className={`actors-page-bio-grid-item${
        showSkeleton ? ' actors-page-bio-grid-item--loading' : ''
      }`}
      role="button"
      tabIndex={0}
      aria-busy={showSkeleton || undefined}
      onClick={() => !showSkeleton && onOpen?.(index)}
      onKeyDown={(e) => {
        if (showSkeleton) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen?.(index);
        }
      }}
    >
      {showSkeleton && (
        <SkeletonLoader
          variant="actors-page-bio-grid-item"
          className="actors-page-bio-grid-item-skeleton"
        />
      )}
      {src ? (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={showSkeleton ? 'actors-page-bio-grid-img--loading' : undefined}
          onLoad={onLoad}
          onError={onError}
        />
      ) : null}
    </div>
  );
};

const SectionIconBio = () => (
  <svg
    className="actors-page-section-heading-svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const SectionIconGallery = () => (
  <svg
    className="actors-page-section-heading-svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const SectionIconVideo = () => (
  <svg
    className="actors-page-section-heading-svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="2" y="7" width="15" height="10" rx="2" ry="2" />
    <polygon points="23 7 16 12 23 17 23 7" />
  </svg>
);

const formatVideoDuration = (sec) => {
  if (!Number.isFinite(sec) || sec <= 0) return '';
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60) % 60;
  const h = Math.floor(sec / 3600);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const markDraphyThumbError = () => {
  /* video yuklanmasa — noop */
};

const ActorVideoDraphyItem = ({ item, openInModal, onOpenVideo }) => {
  const [durationSec, setDurationSec] = useState(null);
  const [mediaReady, setMediaReady] = useState(false);
  const { contentLang } = useContentLanguage();
  const title = item.title?.[contentLang] || item.title?.uz || item.title?.ru || '';
  const showSkeleton = Boolean(item.src) && !mediaReady;

  useEffect(() => {
    setMediaReady(false);
    setDurationSec(null);
  }, [item.src]);

  useEffect(() => {
    if (!item.src || mediaReady) return undefined;
    const soft = window.setTimeout(() => setMediaReady(true), 12000);
    return () => window.clearTimeout(soft);
  }, [item.src, mediaReady]);

  const handleLoadedMetadata = (e) => {
    const el = e.target;
    setDurationSec(el.duration);
    if (openInModal) primeVideoDraphyThumb(el);
    setMediaReady(true);
  };

  const openModal = () => {
    if (showSkeleton) return;
    onOpenVideo?.({
      src: item.src,
      title,
      id: item.id,
      like: item.like,
      dislike: item.dislike,
    });
  };

  const videoWrap = (
    <div
      className={`actors-page-video-draphy-video-wrap${
        showSkeleton ? ' actors-page-video-draphy-video-wrap--loading' : ''
      }`}
    >
      {showSkeleton && (
        <SkeletonLoader
          variant="actors-page-video-draphy-thumb"
          className="actors-page-video-draphy-thumb-skeleton"
        />
      )}
      {item.src ? (
        <video
          className={`actors-page-video-draphy-video${
            showSkeleton ? ' actors-page-video-draphy-video--loading' : ''
          }`}
          src={item.src}
          muted={openInModal || undefined}
          controls={!openInModal || undefined}
          playsInline
          preload={openInModal ? 'auto' : 'metadata'}
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => {
            markDraphyThumbError();
            setMediaReady(true);
          }}
        />
      ) : null}
    </div>
  );

  const infoBlock = (
    <div className="actors-page-video-draphy-info">
      {showSkeleton ? (
        <>
          <div className="actors-page-video-draphy-title actors-page-video-draphy-title--skeleton">
            <SkeletonLoader
              variant="actors-page-video-draphy-title"
              className="actors-page-video-draphy-title-skeleton"
            />
          </div>
          <div className="actors-page-video-draphy-duration actors-page-video-draphy-duration--skeleton">
            <SkeletonLoader
              variant="actors-page-video-draphy-duration"
              className="actors-page-video-draphy-duration-skeleton"
            />
          </div>
        </>
      ) : (
        <>
          <div className="actors-page-video-draphy-title">{title}</div>
          {Number.isFinite(durationSec) && (
            <div className="actors-page-video-draphy-duration">
              {formatVideoDuration(durationSec)}
            </div>
          )}
        </>
      )}
    </div>
  );

  if (openInModal) {
    return (
      <div
        className={`actors-page-video-draphy-item actors-page-video-draphy-item--modal-trigger${
          showSkeleton ? ' actors-page-video-draphy-item--loading' : ''
        }`}
        role="button"
        tabIndex={0}
        aria-busy={showSkeleton || undefined}
        onClick={openModal}
        onKeyDown={(e) => {
          if (showSkeleton) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openModal();
          }
        }}
      >
        {videoWrap}
        {infoBlock}
      </div>
    );
  }

  return (
    <div
      className={`actors-page-video-draphy-item${
        showSkeleton ? ' actors-page-video-draphy-item--loading' : ''
      }`}
      aria-busy={showSkeleton || undefined}
    >
      {videoWrap}
      {infoBlock}
    </div>
  );
};

const ActorsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { contentLang } = useContentLanguage();
  const { getActorById, actorPageSectionLabels, actorsLoading } = useActorsApi();
  const { allMovies, moviesLoading } = useMoviesApi();
  const bioSectionRef = useRef(null);
  const [bioLineClamp, setBioLineClamp] = useState(5);
  const [bioImgModalOpen, setBioImgModalOpen] = useState(false);
  const [bioImgModalIndex, setBioImgModalIndex] = useState(0);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [galleryModalIndex, setGalleryModalIndex] = useState(0);
  const [globalGalleryModalOpen, setGlobalGalleryModalOpen] = useState(false);
  const [videoModal, setVideoModal] = useState(null);
  const [selectedRatingType, setSelectedRatingType] = useState('rating');
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedAge, setSelectedAge] = useState(null);
  const [displaySubscribers, setDisplaySubscribers] = useState(0);

  const actor = getActorById(id);
  const profileImgSrc = actor?.image || '';
  const profileImg = useImageReady(profileImgSrc);
  const showProfileImgSkeleton = Boolean(actor) && profileImg.showSkeleton;

  useEffect(() => {
    setDisplaySubscribers(actor?.subscribers ?? 0);
  }, [actor?.id, actor?.subscribers]);

  const handleActorSubscribeChange = useCallback((isSubscribed) => {
    setDisplaySubscribers((actor?.subscribers ?? 0) + (isSubscribed ? 1 : 0));
  }, [actor?.id, actor?.subscribers]);
  const bioText = actor?.bio?.text?.[contentLang] || actor?.bio?.text?.uz || actor?.bio?.text?.ru || '';

  useLayoutEffect(() => {
    const el = bioSectionRef.current;
    if (!el) return;
    const moreTextEl = el.querySelector('.more-text');
    if (!moreTextEl) return;

    const lineHeightPx = 16 * 1.7;
    const reservedByHeight = 40;

    const update = () => {
      if (moreTextEl.clientHeight > 0) {
        const availableH = Math.max(0, moreTextEl.clientHeight - reservedByHeight);
        const lines = Math.floor(availableH / lineHeightPx);
        const clamp = Math.max(3, Math.min(11, lines));
        setBioLineClamp(clamp);
      }
    };
    update();
    requestAnimationFrame(update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [actor?.id, bioText]);

  useEffect(() => {
    setBioImgModalOpen(false);
    setGalleryModalOpen(false);
    setGlobalGalleryModalOpen(false);
    setVideoModal(null);
    setSelectedRatingType('rating');
    setSelectedRating(null);
    setSelectedCountry(null);
    setSelectedGenres([]);
    setSelectedAge(null);
  }, [id]);

  const actorMovies = useMemo(() => {
    if (!actor) return [];
    const actorId = String(actor.id);
    return allMovies.filter(
      (movie) =>
        Array.isArray(movie.actors) &&
        movie.actors.some((castId) => String(castId) === actorId)
    );
  }, [actor, allMovies]);

  const filteredActorMovies = useMemo(() => {
    let list = actorMovies;
    if (selectedRating !== null) {
      list = list.filter((movie) => getRatingFilter(movie, selectedRatingType, selectedRating));
    }
    if (selectedCountry !== null) {
      list = list.filter((movie) => movie.filterCountry === selectedCountry);
    }
    if (selectedGenres.length > 0) {
      list = list.filter((movie) =>
        (movie.filterGenre || []).some((g) => selectedGenres.includes(g))
      );
    }
    if (selectedAge !== null) {
      list = list.filter((movie) => movie.ageRestriction === selectedAge);
    }
    return list;
  }, [actorMovies, selectedRating, selectedRatingType, selectedCountry, selectedGenres, selectedAge]);

  const photoGallery = actor?.photoGallery || [];
  const videoDraphy = actor?.videoDraphy || [];

  const galleryCells = useMemo(() => {
    const pg = [...(actor?.photoGallery || [])];
    if (pg.length === 0) return [];
    while (pg.length < 6) pg.push(pg[pg.length - 1]);
    return pg.slice(0, 6);
  }, [actor?.photoGallery]);

  const videoModalPlaylist = useMemo(
    () =>
      (actor?.videoDraphy || []).map((v) => ({
        src: v.src,
        title: v.title?.[contentLang] || v.title?.uz || v.title?.ru || '',
        id: v.id,
        like: v.like,
        dislike: v.dislike,
      })),
    [actor?.videoDraphy, contentLang]
  );

  const showMediaRow = galleryCells.length > 0 || videoDraphy.length > 0;
  const mediaRowSplit = galleryCells.length > 0 && videoDraphy.length > 0;
  /* Sahifada 6 tagacha slot; split + kamida 6 ta rasm bo‘lsa Ko‘proq (ma’lumotda aynan 6 ta bo‘lsa ham) */
  const showGalleryMoreButton = mediaRowSplit && photoGallery.length >= 6;

  const VIDEO_DRAPHY_SPLIT_MAX = 3;
  const videoDraphyTruncated = videoDraphy.length > VIDEO_DRAPHY_SPLIT_MAX;
  const videoDraphyListForPage = useMemo(() => {
    if (!videoDraphyTruncated) return videoDraphy;
    return getDisplayItems(videoDraphy, VIDEO_DRAPHY_SPLIT_MAX);
  }, [videoDraphy, videoDraphyTruncated]);

  const showVideoDraphyMoreButton = videoDraphyTruncated;
  const videoDraphyOpenInModal = mediaRowSplit || videoDraphyTruncated;

  if (!actor) {
    if (actorsLoading) {
      return <ActorsPageProfileSkeleton />;
    }
    return (
      <div className="actors-page actors-page-error">
        <h2>{i18n.language === 'uz' ? 'Aktyor topilmadi' : 'Актер не найден'}</h2>
        <button onClick={() => navigate(-1)}>
          {i18n.language === 'uz' ? 'Orqaga' : 'Назад'}
        </button>
      </div>
    );
  }

  const actorName = actor.name[contentLang] || actor.name.uz || actor.name.ru;
  const actorCountry = actor.country?.[contentLang] || actor.country?.uz || actor.country?.ru || '';
  const actorCity = actor.city?.[contentLang] || actor.city?.uz || actor.city?.ru || '';
  const actorGenres = actor.genres?.[contentLang] || actor.genres?.uz || actor.genres?.ru || [];
  const bioImg = actor.bio?.bioImg || [];

  return (
    <div className="actors-page">
      <div className="actors-page-header">
        <div
          className={`actors-page-profile${actor.backgroundImg ? ' actors-page-profile--has-bg' : ''}`}
          style={actor.backgroundImg ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${actor.backgroundImg})` } : undefined}
        >
            <>
              <div
                className={`actors-page-image${
                  showProfileImgSkeleton ? ' actors-page-image--loading' : ''
                }`}
              >
                {showProfileImgSkeleton && (
                  <SkeletonLoader
                    variant="actors-page-image"
                    className="actors-page-image-skeleton"
                  />
                )}
                {profileImgSrc ? (
                  <img
                    ref={profileImg.imgRef}
                    src={profileImgSrc}
                    alt={actorName}
                    className={
                      showProfileImgSkeleton ? 'actors-page-image-img--loading' : undefined
                    }
                    onLoad={profileImg.onLoad}
                    onError={profileImg.onError}
                  />
                ) : null}
              </div>
              <div className="actors-page-info">
                <h1 className="actors-page-name">
                  {actorName}
                  <img src="/img/galichka2.png" alt="" className="actors-page-name-verified" />
                </h1>
                <div className="actors-page-meta">
                  <ScrollTouch className="actors-page-meta-row">
                    {actor.birthDate && (
                      <span className="actors-page-meta-item">
                        <MetaIcon type="birthDate" />
                        {formatDate(actor.birthDate)}
                      </span>
                    )}
                    {actorCountry && (
                      <span className="actors-page-meta-item">
                        <MetaIcon type="country" />
                        {actorCountry}
                      </span>
                    )}
                    {actorCity && (
                      <span className="actors-page-meta-item">
                        <MetaIcon type="city" />
                        {actorCity}
                      </span>
                    )}
                  </ScrollTouch>
                  {actorGenres?.length > 0 && (
                    <ScrollTouch className="actors-page-meta-genres">
                      <strong className="actors-page-meta-genres-label">{i18n.language === 'uz' ? 'Janrlar' : 'Жанры'}:</strong>
                      <div className="actors-page-meta-genres-list">
                        {actorGenres.map((genre, idx) => (
                          <span key={idx} className="actors-page-meta-genre-pill">{genre}</span>
                        ))}
                      </div>
                    </ScrollTouch>
                  )}
                </div>
                <div className="actors-page-subscribe">
                  <span className="actors-page-subscribers-count">
                    {formatCount(displaySubscribers)} {i18n.language === 'uz' ? 'obunachi' : 'подписчиков'}
                  </span>
                  <span className="actors-page-movies-title">
                    {actorMovies.length} {i18n.language === 'uz' ? 'ta video' : 'видео'}
                  </span>
                  <div className="actors-page-follow-btn--desktop">
                    <FollowingButton
                      artistId={actor.id}
                      onSubscribeChange={handleActorSubscribeChange}
                    />
                  </div>
                </div>
              </div>
            </>
        </div>
        <div className="actors-page-follow-btn--mobile">
            <FollowingButton
              artistId={actor.id}
              onSubscribeChange={handleActorSubscribeChange}
            />
          </div>

        {(bioText || bioImg?.length > 0) && (
          <div className="actors-page-bio">
            <div className="actors-page-bio-inner">
              {bioText && (
                <div ref={bioSectionRef} className="actors-page-bio-text">
                  <h3 className="actors-page-section-heading actors-page-bio-text-title">
                    <span className="actors-page-section-heading-icon" aria-hidden>
                      <SectionIconBio />
                    </span>
                    <span className="actors-page-section-heading-text">
                      {i18n.language === 'uz' ? 'Biografiya' : 'Биография'}
                    </span>
                  </h3>
                  <MoreText
                    text={bioText}
                    bioImg={[]}
                    lineClamp={bioLineClamp}
                    moreLabel={i18n.language === 'uz' ? 'Yana' : 'Ещё'}
                    modalTitle={actorName}
                    className="actors-page-moretext"
                  />
                </div>
              )}
              {bioImg?.length > 0 && (
                <div className="actors-page-bio-images">
                  <div className="actors-page-bio-grid">
                    {bioImg.slice(0, 6).map((src, idx) => (
                      <ActorsPageBioGridItem
                        key={`${src}-${idx}`}
                        src={src}
                        alt={`${actorName} ${idx + 1}`}
                        index={idx}
                        onOpen={(i) => {
                          setBioImgModalIndex(i);
                          setBioImgModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showMediaRow && (
        <div className="actors-page-media-wrap">
          <div
            className={`actors-page-media-row${mediaRowSplit ? ' actors-page-media-row--split' : ''}`}
          >
            {galleryCells.length > 0 && (
              <div className="actors-page-photo-gallery-block">
                <div className="actors-page-photo-gallery-head">
                  <h3 className="actors-page-media-heading actors-page-section-heading">
                    <span className="actors-page-section-heading-icon" aria-hidden>
                      <SectionIconGallery />
                    </span>
                    <span className="actors-page-section-heading-text">
                      {i18n.language === 'uz' ? 'Foto galereya' : 'Фотогалерея'}
                    </span>
                  </h3>
                  {showGalleryMoreButton && (
                    <ShowMoreButton
                      className="actors-page-photo-gallery-more-btn"
                      onClick={() => setGlobalGalleryModalOpen(true)}
                    />
                  )}
                </div>
                <div className="actors-page-photo-gallery-grid">
                <ActorsPagePgCell
                  className="actors-page-pg-cell--hero"
                  src={galleryCells[0]}
                  index={0}
                  onOpen={(i) => {
                    setGalleryModalIndex(i);
                    setGalleryModalOpen(true);
                  }}
                />
                <ActorsPagePgCell
                  className="actors-page-pg-cell--mid-top"
                  src={galleryCells[1]}
                  index={1}
                  onOpen={(i) => {
                    setGalleryModalIndex(i);
                    setGalleryModalOpen(true);
                  }}
                />
                <ActorsPagePgCell
                  className="actors-page-pg-cell--mid-bottom"
                  src={galleryCells[2]}
                  index={2}
                  onOpen={(i) => {
                    setGalleryModalIndex(i);
                    setGalleryModalOpen(true);
                  }}
                />
                <div className="actors-page-pg-cell actors-page-pg-cell--right">
                  <div className="actors-page-pg-right-top">
                    <ActorsPagePgCell
                      className="actors-page-pg-cell--small"
                      src={galleryCells[3]}
                      index={3}
                      onOpen={(i) => {
                        setGalleryModalIndex(i);
                        setGalleryModalOpen(true);
                      }}
                    />
                    <ActorsPagePgCell
                      className="actors-page-pg-cell--small"
                      src={galleryCells[4]}
                      index={4}
                      onOpen={(i) => {
                        setGalleryModalIndex(i);
                        setGalleryModalOpen(true);
                      }}
                    />
                  </div>
                  <ActorsPagePgCell
                    className="actors-page-pg-cell--wide"
                    src={galleryCells[5]}
                    index={5}
                    onOpen={(i) => {
                      setGalleryModalIndex(i);
                      setGalleryModalOpen(true);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

            {videoDraphy.length > 0 && (
              <div className="actors-page-video-draphy-block">
                <div className="actors-page-video-draphy-head">
                  <h3 className="actors-page-media-heading actors-page-section-heading">
                    <span className="actors-page-section-heading-icon" aria-hidden>
                      <SectionIconVideo />
                    </span>
                    <span className="actors-page-section-heading-text">
                      {i18n.language === 'uz' ? 'Videografiya' : 'Видеография'}
                    </span>
                  </h3>
                  {showVideoDraphyMoreButton && (
                    <ShowMoreButton
                      className="actors-page-video-draphy-more-btn"
                      onClick={() => {
                        const first = videoModalPlaylist[0];
                        if (first) setVideoModal(first);
                      }}
                    />
                  )}
                </div>
                <div className="actors-page-video-draphy-list">
                  {videoDraphyListForPage.map((v, idx) => (
                    <ActorVideoDraphyItem
                      key={v.id != null ? `vd-${v.id}` : `${v.src}-${idx}`}
                      item={v}
                      openInModal={videoDraphyOpenInModal}
                      onOpenVideo={setVideoModal}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {actor && (
        <div className="actors-page-extras-wrap">
          <ActorAwardsSection
            awards={actor.awards}
            title={
              actorPageSectionLabels?.awards?.[contentLang] ||
              actorPageSectionLabels?.awards?.uz ||
              ''
            }
          />
          <SimilarActors currentActorId={actor.id} actorsGenre={actor.actorsGenre} />
          <ActorTopRatedKinolar actorId={actor.id} />
        </div>
      )}

      <div className="actors-page-movies">
        <Filters
          movies={actorMovies}
          selectedRatingType={selectedRatingType}
          selectedRating={selectedRating}
          onRatingTypeSelect={setSelectedRatingType}
          onRatingSelect={setSelectedRating}
          selectedCountry={selectedCountry}
          onCountrySelect={setSelectedCountry}
          selectedGenres={selectedGenres}
          onGenreSelect={setSelectedGenres}
          selectedAge={selectedAge}
          onAgeSelect={setSelectedAge}
          isLoading={moviesLoading}
        />
        <Movies
          sectionType="all"
          limit={null}
          filteredMovies={filteredActorMovies}
          hideHeader
          isLoading={moviesLoading}
          showHorizontalScroll
        />
      </div>

      <ImgModal
        isOpen={bioImgModalOpen}
        onClose={() => setBioImgModalOpen(false)}
        images={bioImg}
        currentIndex={bioImgModalIndex}
        onIndexChange={setBioImgModalIndex}
      />
      <GlobalModal
        isOpen={globalGalleryModalOpen}
        onClose={() => setGlobalGalleryModalOpen(false)}
        title={i18n.language === 'uz' ? 'Foto galereya' : 'Фотогалерея'}
        images={photoGallery}
        onImageClick={(index) => {
          setGlobalGalleryModalOpen(false);
          setGalleryModalIndex(index);
          setGalleryModalOpen(true);
        }}
      />
      <ImgModal
        isOpen={galleryModalOpen}
        onClose={() => setGalleryModalOpen(false)}
        images={photoGallery}
        currentIndex={galleryModalIndex}
        onIndexChange={setGalleryModalIndex}
      />
      <VideoModal
        isOpen={!!videoModal}
        onClose={() => setVideoModal(null)}
        src={videoModal?.src}
        title={videoModal?.title}
        videoId={videoModal?.id}
        videoLike={videoModal?.like}
        videoDislike={videoModal?.dislike}
        relatedVideos={videoModalPlaylist}
        onSelectVideo={setVideoModal}
        relatedVideosLabel={i18n.language === 'uz' ? 'Boshqa videolar' : 'Другие видео'}
      />
    </div>
  );
};

export default ActorsPage;
