import React, { useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMoviesApi } from '../../context/MoviesApiContext';
import { useMusicApi } from '../../context/MusicApiContext';
import { resolveShortsWithMovies } from '../../utils/resolveShortsWithMovies';
import { getWatchHistory } from '../../api/shortsWatchHistory';
import { getShortsForHomeBlock } from '../../algo/shortsRecommendationAlgo';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import SkeletonLoader from '../SkeletonLoader/SkeletonLoader';
import ShortsVideoThumb from '../ShortsVideos/ShortsVideoThumb';
import ViewCount from '../ViewCount/ViewCount';
import '../ShortsVideos/ShortsVideos.css';
import './HomeShorts.css';

const blockIndexMap = { primary: 0, secondary: 1, tertiary: 2, quaternary: 3, quinary: 4 };
const HOME_SHORTS_SKELETON_COUNT = 8;

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

  const isMusic = source === 'music';
  const movieShortsCatalog = useMemo(
    () =>
      resolveShortsWithMovies(allShortsVideos, allMovies, allMusic, allClips, allConcerts),
    [allShortsVideos, allMovies, allMusic, allClips, allConcerts]
  );
  const allShorts = isMusic ? musicShortsCatalog : movieShortsCatalog;
  const moreTo = isMusic ? '/music/shorts' : '/shorts';
  /* API + bog‘liq kataloglar tugaguncha skeleton */
  const isDataLoading = isMusic
    ? musicShortsLoading
    : shortsLoading || moviesLoading;

  const homeShorts = useMemo(() => {
    const history = getWatchHistory();
    const idx = blockIndexMap[variant] ?? 0;
    return getShortsForHomeBlock(allShorts, history, idx);
  }, [variant, allShorts]);

  const showSectionSkeleton = isDataLoading && homeShorts.length === 0;
  const showHeaderSkeleton = isDataLoading;

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
            <>
              <SkeletonLoader
                variant="home-shorts-title"
                className="home-shorts-title-skeleton"
              />
              <SkeletonLoader
                variant="home-shorts-more"
                className="home-shorts-more-skeleton"
              />
            </>
          ) : (
            <>
              <h2 className="home-shorts-title">
                {isMusic ? t('music.shorts', 'Shorts') : t('navbar.shorts', 'Shorts')}
              </h2>
              <Link to={moreTo} className="home-shorts-more">
                {isMusic ? t('music.all', 'Barchasi') : t('categories.all', 'Barchasi')}
              </Link>
            </>
          )}
        </div>
        <HorizontalScroll scrollAmount={200}>
          {showSectionSkeleton
            ? skeletonCards
            : homeShorts.slice(0, 12).map((item, index) => {
                const startIndex = allShorts.findIndex((s) => s.id === item.id);
                const safeIndex = startIndex >= 0 ? startIndex : index;
                const isAutoPlay = shouldAutoPlay(index);
                return (
                  <Link
                    key={item.id}
                    to={`${moreTo}?startIndex=${safeIndex}`}
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
