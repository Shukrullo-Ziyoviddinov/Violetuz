import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import '../ShortsVideos/ShortsVideos.css';
import './HomeShorts.css';

const blockIndexMap = { primary: 0, secondary: 1, tertiary: 2, quaternary: 3, quinary: 4 };
const HOME_SHORTS_SKELETON_COUNT = 8;

/** 2-, 4-, 6-... pozitsiyadagi videolar ko'rinishda avto-ijro */
const shouldAutoPlay = (index) => (index + 1) % 2 === 0;

const HomeShorts = ({ variant = 'primary', source = 'movie' }) => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const { allShortsVideos, allMovies, shortsLoading } = useMoviesApi();
  const {
    allMusic,
    allClips,
    allConcerts,
    musicShortsCatalog,
    musicShortsLoading,
  } = useMusicApi();
  const [loadedPreviews, setLoadedPreviews] = useState({});
  const containerRef = useRef(null);

  const isMusic = source === 'music';
  const movieShortsCatalog = useMemo(
    () =>
      resolveShortsWithMovies(allShortsVideos, allMovies, allMusic, allClips, allConcerts),
    [allShortsVideos, allMovies, allMusic, allClips, allConcerts]
  );
  const allShorts = isMusic ? musicShortsCatalog : movieShortsCatalog;
  const moreTo = isMusic ? '/music/shorts' : '/shorts';
  const isDataLoading = isMusic ? musicShortsLoading : shortsLoading;

  const homeShorts = useMemo(() => {
    const history = getWatchHistory();
    const idx = blockIndexMap[variant] ?? 0;
    return getShortsForHomeBlock(allShorts, history, idx);
  }, [variant, allShorts]);

  const showSectionSkeleton = isDataLoading && homeShorts.length === 0;

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
      aria-busy={showSectionSkeleton || undefined}
    >
      <div className={`home-shorts-container ${isMusic ? 'music-cards-container' : ''}`} ref={containerRef}>
        <div className="home-shorts-header">
          {showSectionSkeleton ? (
            <>
              <SkeletonLoader
                variant="movies-title"
                className="home-shorts-title-skeleton"
                width={140}
                height={28}
              />
              <SkeletonLoader
                variant="block"
                className="home-shorts-more-skeleton"
                width={88}
                height={32}
                style={{ borderRadius: 20 }}
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
                    className="shorts-video-card home-shorts-card"
                    data-index={index}
                  >
                    <div
                      className="shorts-video-thumb"
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
                      {!loadedPreviews[item.id] && (
                        <SkeletonLoader
                          variant="shorts-thumb"
                          className="shorts-video-thumb-skeleton"
                        />
                      )}
                      <video
                        src={getVideo(item)}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className={`shorts-video-preview ${!loadedPreviews[item.id] ? 'shorts-video-loading' : ''}`}
                        onLoadedData={() =>
                          setLoadedPreviews((p) => ({ ...p, [item.id]: true }))
                        }
                        onCanPlay={() =>
                          setLoadedPreviews((p) =>
                            p[item.id] ? p : { ...p, [item.id]: true }
                          )
                        }
                      />
                    </div>
                  </Link>
                );
              })}
        </HorizontalScroll>
      </div>
    </section>
  );
};

export default HomeShorts;
