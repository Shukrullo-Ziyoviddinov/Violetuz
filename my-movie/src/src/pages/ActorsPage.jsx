import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getActorById, actorPageSectionLabels } from '../data/actors';
import { allMovies } from '../data/movies';
import { useContentLanguage } from '../context/ContentLanguageContext';
import LoaderSkeleton from '../components/LoaderSkeleton/LoaderSkeleton';
import Movies from '../components/Movies/Movies';
import MoreText from '../components/MoreText/MoreText';
import ScrollTouch from '../components/ScrollTouch/ScrollTouch';
import FollowingButton from '../Music/FollowingButton/FollowingButton';
import ImgModal from '../components/ImgModal/ImgModal';
import GlobalModal from '../components/GlobalModal/GlobalModal';
import VideoModal from '../components/VideoModal/VideoModal';
import ShowMoreButton, { getDisplayItems } from '../components/ShowMoreButton/ShowMoreButton';
import ActorAwardsSection from '../components/ActorAwardsSection/ActorAwardsSection';
import SimilarActors from '../components/SimilarActors/SimilarActors';
import ActorTopRatedKinolar from '../components/ActorTopRatedKinolar/ActorTopRatedKinolar';
import Filters from '../components/Filters';
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
  const { contentLang } = useContentLanguage();
  const title = item.title?.[contentLang] || item.title?.uz || item.title?.ru || '';

  const openModal = () => {
    onOpenVideo?.({
      src: item.src,
      title,
      id: item.id,
      like: item.like,
      dislike: item.dislike,
    });
  };

  if (openInModal) {
    return (
      <div
        className="actors-page-video-draphy-item actors-page-video-draphy-item--modal-trigger"
        role="button"
        tabIndex={0}
        onClick={openModal}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openModal();
          }
        }}
      >
        <div className="actors-page-video-draphy-video-wrap">
          <video
            className="actors-page-video-draphy-video"
            src={item.src}
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={(e) => {
              setDurationSec(e.target.duration);
              primeVideoDraphyThumb(e.target);
            }}
            onError={markDraphyThumbError}
          />
        </div>
        <div className="actors-page-video-draphy-info">
          <div className="actors-page-video-draphy-title">{title}</div>
          {Number.isFinite(durationSec) && (
            <div className="actors-page-video-draphy-duration">{formatVideoDuration(durationSec)}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="actors-page-video-draphy-item">
      <div className="actors-page-video-draphy-video-wrap">
        <video
          className="actors-page-video-draphy-video"
          src={item.src}
          controls
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => setDurationSec(e.target.duration)}
          onError={markDraphyThumbError}
        />
      </div>
      <div className="actors-page-video-draphy-info">
        <div className="actors-page-video-draphy-title">{title}</div>
        {Number.isFinite(durationSec) && (
          <div className="actors-page-video-draphy-duration">{formatVideoDuration(durationSec)}</div>
        )}
      </div>
    </div>
  );
};

const ActorsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { contentLang } = useContentLanguage();
  const [actorsLoading, setActorsLoading] = useState(true);
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
  }, [actor?.id, actorsLoading, bioText]);

  useEffect(() => {
    setActorsLoading(true);
    setBioImgModalOpen(false);
    setGalleryModalOpen(false);
    setGlobalGalleryModalOpen(false);
    setVideoModal(null);
    setSelectedRatingType('rating');
    setSelectedRating(null);
    setSelectedCountry(null);
    setSelectedGenres([]);
    setSelectedAge(null);
    const timer = setTimeout(() => setActorsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [id]);

  const actorMovies = useMemo(
    () => (actor ? allMovies.filter((movie) => movie.actors?.includes(actor.id)) : []),
    [actor?.id]
  );

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
          {actorsLoading ? (
            <>
              <LoaderSkeleton variant="actors-page-image" width={120} className="actors-page-image-skeleton" />
              <div className="actors-page-info actors-page-info-skeleton">
                <LoaderSkeleton variant="actors-page-name" width="80%" height={36} className="actors-page-name-skeleton" />
                <LoaderSkeleton variant="actors-page-desc" width="100%" height={60} className="actors-page-desc-skeleton" />
              </div>
            </>
          ) : (
            <>
              <div className="actors-page-image">
                <img src={actor.image} alt={actorName} />
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
                      subscriberCount={actor.subscribers ?? 0}
                      onSubscribeChange={handleActorSubscribeChange}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        {!actorsLoading && (
          <div className="actors-page-follow-btn--mobile">
            <FollowingButton
              artistId={actor.id}
              subscriberCount={actor.subscribers ?? 0}
              onSubscribeChange={handleActorSubscribeChange}
            />
          </div>
        )}

        {(bioText || bioImg?.length > 0) && !actorsLoading && (
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
                      <div
                        key={idx}
                        className="actors-page-bio-grid-item"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setBioImgModalIndex(idx);
                          setBioImgModalOpen(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setBioImgModalIndex(idx);
                            setBioImgModalOpen(true);
                          }
                        }}
                      >
                        <img src={src} alt={`${actorName} ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!actorsLoading && showMediaRow && (
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
                <div
                  className="actors-page-pg-cell actors-page-pg-cell--hero"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setGalleryModalIndex(0);
                    setGalleryModalOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setGalleryModalIndex(0);
                      setGalleryModalOpen(true);
                    }
                  }}
                >
                  <img src={galleryCells[0]} alt="" />
                </div>
                <div
                  className="actors-page-pg-cell actors-page-pg-cell--mid-top"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setGalleryModalIndex(1);
                    setGalleryModalOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setGalleryModalIndex(1);
                      setGalleryModalOpen(true);
                    }
                  }}
                >
                  <img src={galleryCells[1]} alt="" />
                </div>
                <div
                  className="actors-page-pg-cell actors-page-pg-cell--mid-bottom"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setGalleryModalIndex(2);
                    setGalleryModalOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setGalleryModalIndex(2);
                      setGalleryModalOpen(true);
                    }
                  }}
                >
                  <img src={galleryCells[2]} alt="" />
                </div>
                <div className="actors-page-pg-cell actors-page-pg-cell--right">
                  <div className="actors-page-pg-right-top">
                    <div
                      className="actors-page-pg-cell actors-page-pg-cell--small"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setGalleryModalIndex(3);
                        setGalleryModalOpen(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setGalleryModalIndex(3);
                          setGalleryModalOpen(true);
                        }
                      }}
                    >
                      <img src={galleryCells[3]} alt="" />
                    </div>
                    <div
                      className="actors-page-pg-cell actors-page-pg-cell--small"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setGalleryModalIndex(4);
                        setGalleryModalOpen(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setGalleryModalIndex(4);
                          setGalleryModalOpen(true);
                        }
                      }}
                    >
                      <img src={galleryCells[4]} alt="" />
                    </div>
                  </div>
                  <div
                    className="actors-page-pg-cell actors-page-pg-cell--wide"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setGalleryModalIndex(5);
                      setGalleryModalOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setGalleryModalIndex(5);
                        setGalleryModalOpen(true);
                      }
                    }}
                  >
                    <img src={galleryCells[5]} alt="" />
                  </div>
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

      {!actorsLoading && actor && (
        <div className="actors-page-extras-wrap">
          <ActorAwardsSection
            awards={actor.awards}
            title={
              actorPageSectionLabels.awards[contentLang] ||
              actorPageSectionLabels.awards.uz
            }
          />
          <SimilarActors currentActorId={actor.id} actorsGenre={actor.actorsGenre} />
          <ActorTopRatedKinolar actorId={actor.id} />
        </div>
      )}

      <div className="actors-page-movies">
        <Filters
          isLoading={actorsLoading}
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
        />
        <Movies
          sectionType="all"
          limit={null}
          filteredMovies={filteredActorMovies}
          hideHeader
          isLoading={actorsLoading}
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
