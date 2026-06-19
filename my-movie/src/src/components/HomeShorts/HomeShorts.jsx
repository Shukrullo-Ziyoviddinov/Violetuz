import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { shortsVideos } from '../../data/shortsVideos';
import { musicShorts } from '../../dataMusic/musicShorts';
import { getWatchHistory } from '../../api/shortsWatchHistory';
import { getShortsForHomeBlock } from '../../algo/shortsRecommendationAlgo';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import LoaderSkeleton from '../LoaderSkeleton/LoaderSkeleton';
import '../ShortsVideos/ShortsVideos.css';
import './HomeShorts.css';

const blockIndexMap = { primary: 0, secondary: 1, tertiary: 2, quaternary: 3, quinary: 4 };

/** 2-, 4-, 6-... pozitsiyadagi videolar ko'rinishda avto-ijro */
const shouldAutoPlay = (index) => (index + 1) % 2 === 0;

const HomeShorts = ({ variant = 'primary', source = 'movie' }) => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const [loadedPreviews, setLoadedPreviews] = useState({});
  const [headerLoading, setHeaderLoading] = useState(true);
  const containerRef = useRef(null);

  const isMusic = source === 'music';
  const allShorts = isMusic ? musicShorts : shortsVideos;
  const moreTo = isMusic ? '/music/shorts' : '/shorts';

  useEffect(() => {
    const t = setTimeout(() => setHeaderLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const homeShorts = useMemo(() => {
    const history = getWatchHistory();
    const idx = blockIndexMap[variant] ?? 0;
    return getShortsForHomeBlock(allShorts, history, idx);
  }, [variant, allShorts]);

  useEffect(() => {
    if (!containerRef.current) return;
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
  }, [homeShorts]);

  const getVideo = (item) => item.video?.[contentLang] || item.video?.uz || '';

  return (
    <section className={`home-shorts ${isMusic ? 'home-shorts--music music-cards' : ''}`}>
      <div className={`home-shorts-container ${isMusic ? 'music-cards-container' : ''}`} ref={containerRef}>
        <div className="home-shorts-header">
          {headerLoading ? (
            <div className="home-shorts-title-skeleton">
              <LoaderSkeleton variant="detail-title" width={120} />
            </div>
          ) : (
            <h2 className="home-shorts-title">{isMusic ? t('music.shorts', 'Shorts') : t('navbar.shorts', 'Shorts')}</h2>
          )}
          {headerLoading ? (
            <div className="home-shorts-more-skeleton">
              <LoaderSkeleton variant="more-btn" width={80} height={36} />
            </div>
          ) : (
            <Link to={moreTo} className="home-shorts-more">
              {isMusic ? t('music.all', 'Barchasi') : t('categories.all', 'Barchasi')}
            </Link>
          )}
        </div>
        <HorizontalScroll scrollAmount={200}>
        {homeShorts.slice(0, 12).map((item, index) => {
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
                onMouseEnter={!isAutoPlay ? (e) => {
                  const v = e.currentTarget.querySelector('video');
                  if (v) v.play().catch(() => {});
                } : undefined}
                onMouseLeave={!isAutoPlay ? (e) => {
                  const v = e.currentTarget.querySelector('video');
                  if (v) {
                    v.pause();
                    v.currentTime = 0;
                  }
                } : undefined}
              >
                {!loadedPreviews[item.id] && (
                  <LoaderSkeleton variant="shorts-video-preview" className="shorts-video-preview-skeleton" />
                )}
                <video
                  src={getVideo(item)}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className={`shorts-video-preview ${!loadedPreviews[item.id] ? 'shorts-video-loading' : ''}`}
                  onLoadedData={() => setLoadedPreviews((p) => ({ ...p, [item.id]: true }))}
                  onCanPlay={() => setLoadedPreviews((p) => (p[item.id] ? p : { ...p, [item.id]: true }))}
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
