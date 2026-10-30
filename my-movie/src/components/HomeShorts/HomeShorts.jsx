import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useMusicApi } from '../../context/MusicApiContext';
import { resolveShortsWithMovies } from '../../utils/resolveShortsWithMovies';
import { fetchShortsShelf } from '../../api/shortsRecoApi';
import { getShortsForHomeBlock } from '../../algo/shortsRecommendationAlgo';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import ShortsVideoThumb from '../ShortsVideos/ShortsVideoThumb';
import ViewCount from '../ViewCount/ViewCount';
import '../ShortsVideos/ShortsVideos.css';
import './HomeShorts.css';

const blockIndexMap = { default: 0, primary: 0, secondary: 1, tertiary: 2, quaternary: 3, quinary: 4 };
const HOME_SHORTS_SKELETON_COUNT = 8;
const SHELF_SIZE = 10;

/** 2-, 4-, 6-... pozitsiyadagi videolar ko'rinishda avto-ijro */
const shouldAutoPlay = (index) => (index + 1) % 2 === 0;

const HomeShorts = ({ variant = 'primary', source = 'movie' }) => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const { allShortsVideos, allMovies, shortsLoading, moviesLoading } = useMoviesApi();
  const {
    allMusic,
    allClips,
    allConcerts,
    musicShortsCatalog,
    musicShortsLoading,
  } = useMusicApi();
  const containerRef = useRef(null);
  const [shelfIds, setShelfIds] = useState(null);
  const [shelfFailed, setShelfFailed] = useState(false);

  const isMusic = source === 'music';
  const movieShortsCatalog = useMemo(
    () =>
      resolveShortsWithMovies(allShortsVideos, allMovies, allMusic, allClips, allConcerts),
    [allShortsVideos, allMovies, allMusic, allClips, allConcerts]
  );
  const allShorts = isMusic ? musicShortsCatalog : movieShortsCatalog;
  /* API + bog‘liq kataloglar tugaguncha skeleton */
  const isDataLoading = isMusic
    ? musicShortsLoading
    : shortsLoading || moviesLoading;

  const blockIndex = blockIndexMap[variant] ?? 0;

  useEffect(() => {
    let cancelled = false;
    setShelfIds(null);
    setShelfFailed(false);
    fetchShortsShelf({
      type: isMusic ? 'musicshorts' : 'movieShorts',
      block: blockIndex,
      limit: SHELF_SIZE,
    })
      .then((page) => {
        if (cancelled) return;
        setShelfIds(Array.isArray(page?.items) ? page.items : []);
      })
      .catch(() => {
        if (!cancelled) setShelfFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isMusic, blockIndex]);

  const homeShorts = useMemo(() => {
    const fallback = () => getShortsForHomeBlock(allShorts, [], blockIndex).slice(0, SHELF_SIZE);
    if (shelfFailed) return fallback();
    if (!Array.isArray(shelfIds)) return [];
    return shelfIds
      .map((row) => allShorts.find((item) => {
        if (String(item.id) !== String(row.id)) return false;
        if (!row.type || !item.type) return true;
        return item.type === row.type;
      }))
      .filter(Boolean)
      .slice(0, SHELF_SIZE);
  }, [allShorts, blockIndex, shelfFailed, shelfIds]);

  const shelfLoading = !shelfFailed && shelfIds == null;
  const showSectionSkeleton = shelfLoading || (isDataLoading && homeShorts.length === 0);
  const showHeaderSkeleton = shelfLoading || isDataLoading;

  useEffect(() => {
    if (!containerRef.current || showSectionSkeleton) return;
    const videos = containerRef.current.querySelectorAll('.home-shorts-card');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const card = entry.target;
          const idx = parseInt(card.dataset.index, 10);
          if (!shouldAutoPlay(idx)) return;
          const v = card.querySelector('video');
          if (!v) return;
          if (entry.isIntersecting) v.play().catch(() => {});
          else {
            v.pause();
            v.currentTime = 0;
          }
        });
      },
      { rootMargin: '50px', threshold: 0.25 }
    );
    videos.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [homeShorts, showSectionSkeleton]);

  const getVideo = (item) => item.video?.[contentLang] || item.video?.uz || '';

  const skeletonCards = useMemo(
    () =>
      Array.from({ length: HOME_SHORTS_SKELETON_COUNT }, (_, index) => (
        <div
          key={`home-shorts-skeleton-${index}`}
          className="shorts-video-card home-shorts-card home-shorts-card--skeleton"
          aria-hidden="true"
        >
          <div className="shorts-video-thumb">
            <SkeletonLoader
              variant="shorts-thumb"
              className="shorts-video-thumb-skeleton"
            />
          </div>
        </div>
      )),
    []
  );

  if (!showSectionSkeleton && homeShorts.length === 0) return null;

  return (
    <section
      className={`home-shorts ${isMusic ? 'home-shorts--music music-cards' : ''}`}
      aria-busy={showHeaderSkeleton || showSectionSkeleton || undefined}
    >
      <div className={`home-shorts-container ${isMusic ? 'music-cards-container' : ''}`} ref={containerRef}>
        <div
          className={`home-shorts-header${showHeaderSkeleton ? ' home-shorts-header--skeleton' : ''}`}
          aria-busy={showHeaderSkeleton || undefined}
        >
          {showHeaderSkeleton ? (
            <SkeletonLoader
              variant="home-shorts-title"
              className="home-shorts-title-skeleton"
            />
          ) : (
            <h2 className="home-shorts-title">
              {isMusic ? t('music.shorts', 'Shorts') : t('navbar.shorts', 'Shorts')}
            </h2>
          )}
        </div>
        <HorizontalScroll scrollAmount={200}>
          {showSectionSkeleton
            ? skeletonCards
            : homeShorts.slice(0, SHELF_SIZE).map((item, index) => {
                const isAutoPlay = shouldAutoPlay(index);
                return (
                  <Link
                    key={`${item.type || 'short'}-${item.id}`}
                    to={`/shorts?shortId=${item.id}`}
                    state={{ shortsReturnTo: isMusic ? '/music' : '/' }}
                    className="shorts-video-card home-shorts-card"
                    data-index={index}
                  >
                    <ShortsVideoThumb
                      videoSrc={getVideo(item)}
                      onMouseEnter={
                        !isAutoPlay
                          ? (e) => {
                              const v = e.currentTarget.querySelector('video');
                              if (v) v.play().catch(() => {});
                            }
                          : undefined
                      }
                      onMouseLeave={
                        !isAutoPlay
                          ? (e) => {
                              const v = e.currentTarget.querySelector('video');
                              if (v) {
                                v.pause();
                                v.currentTime = 0;
                              }
                            }
                          : undefined
                      }
                    >
                      {item?.id != null ? (
                        <ViewCount
                          itemId={item.id}
                          type={
                            item?.type === 'musicshorts' || isMusic
                              ? 'musicshorts'
                              : 'movieShorts'
                          }
                          variant="icon"
                          record={false}
                          className="shorts-video-card-views"
                        />
                      ) : null}
                    </ShortsVideoThumb>
                  </Link>
                );
              })}
        </HorizontalScroll>
      </div>
    </section>
  );
};

export default HomeShorts;
