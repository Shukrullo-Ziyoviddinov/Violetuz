import React, { useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWishlist } from '../context/WishlistContext';
import { useMusicApi } from '../context/MusicApiContext';
import { matchId } from '../utils/musicDataUtils';
import ShareButton from '../components/ShareButton/ShareButton';
import ScrollTouch from '../components/ScrollTouch/ScrollTouch';
import FollowingButton from '../Music/FollowingButton/FollowingButton';
import LikeButton from '../Music/LikeButton/LikeButton';
import Repost from '../components/Repost/Repost';
import MusicVideoPlayer from '../Music/MusicVideoPlayer/MusicVideoPlayer';
import VideoDetailTrendCard from './VideoDetailTrendCard';
import MovieComments from '../components/MovieDetail/MovieComments';
import RecommendedClips from '../Music/RecommendedClips/RecommendedClips';
import SimilarSongs from '../Music/SimilarSongs/SimilarSongs';
import AlbumsForYou from '../Music/AlbumsForYou/AlbumsForYou';
import SkeletonLoader from '../components/SkeletonLoader/SkeletonLoader';
import { useImageReady } from '../utils/useImageReady';
import { formatCount } from '../utils/utils';
import useImmersiveSheetDrag from '../hooks/useImmersiveSheetDrag';
import './VideoPage.css';

const TREND_SKELETON_COUNT = 8;
const ACTION_SKELETON_COUNT = 5;

const trendSkeletonItems = Array.from({ length: TREND_SKELETON_COUNT }, (_, i) => ({
  id: `video-trend-skel-${i}`,
}));

const VideoTrendCardSkeleton = () => (
  <div className="video-detail-trend-card video-detail-trend-card--skeleton" aria-hidden="true">
    <div className="video-detail-trend-card-img-wrap">
      <SkeletonLoader
        variant="video-detail-trend-img"
        className="video-detail-trend-card-img-skeleton"
      />
    </div>
    <div className="video-detail-trend-card-info">
      <SkeletonLoader variant="video-detail-trend-card-title" />
      <SkeletonLoader variant="video-detail-trend-card-artist" />
      <SkeletonLoader variant="video-detail-trend-card-year" />
    </div>
  </div>
);

const VideoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const {
    allClips,
    allConcerts,
    clipSections,
    concertSections,
    getClipsByCategory,
    getConcertsByCategory,
    getArtistById,
    clipsLoading,
    concertsLoading,
    artistsLoading,
  } = useMusicApi();
  const videoRef = useRef(null);
  const commentsRef = useRef(null);
  const {
    scrollRef,
    pinRef,
    isImmersive,
    rootClassNames: sheetClassNames,
    sheetStyle,
    handleExpandToggle,
    isMobileViewport,
    scrollTouchHandlers,
    pinTouchHandlers,
  } = useImmersiveSheetDrag({
    mobileMax: 900,
    resetKey: id,
  });

  const videosLoading = Boolean(clipsLoading) || Boolean(concertsLoading);

  const allVideoData = useMemo(
    () => [...(Array.isArray(allClips) ? allClips : []), ...(Array.isArray(allConcerts) ? allConcerts : [])],
    [allClips, allConcerts]
  );

  const video = allVideoData.find((v) => matchId(v.id, id));
  const artist = video ? getArtistById(video.artistId) : null;

  const artistImgSrc = artist
    ? artist.imgArtist || artist.img || '/img/movie1.jpg'
    : '';
  const artistImg = useImageReady(artistImgSrc);

  const showHeroDataSkeleton = Boolean(videosLoading) && !video;
  const showInfoSkeleton = showHeroDataSkeleton;
  const showActionsSkeleton = showHeroDataSkeleton;
  const showArtistCardDataSkeleton =
    showHeroDataSkeleton ||
    (Boolean(video?.artistId) && Boolean(artistsLoading) && !artist);
  const showArtistImgSkeleton = Boolean(artist) && artistImg.showSkeleton;
  const showArtistCard = showArtistCardDataSkeleton || Boolean(artist?.id);

  const relatedMeta = useMemo(() => {
    if (!video) {
      return { list: [], titleKey: 'music.trendClips', titleDefault: 'Trend Kliplar' };
    }

    const apiClipSection = (clipSections || []).find(
      (s) => s.categoryNameMusic === video.categoryNameMusic
    );
    if (apiClipSection) {
      return {
        list: getClipsByCategory(apiClipSection.categoryNameMusic),
        titleKey: apiClipSection.titleKey,
        titleDefault: apiClipSection.titleDefault,
      };
    }

    const apiConcertSection = (concertSections || []).find(
      (s) => s.categoryNameMusic === video.categoryNameMusic
    );
    if (apiConcertSection) {
      return {
        list: getConcertsByCategory(apiConcertSection.categoryNameMusic),
        titleKey: apiConcertSection.titleKey,
        titleDefault: apiConcertSection.titleDefault,
      };
    }

    return {
      list: video.type === 'konsert'
        ? getConcertsByCategory(video.categoryNameMusic)
        : getClipsByCategory(video.categoryNameMusic),
      titleKey: 'music.trendClips',
      titleDefault: 'Trend Kliplar',
    };
  }, [video, clipSections, concertSections, getClipsByCategory, getConcertsByCategory]);

  const relatedList = relatedMeta.list?.length ? relatedMeta.list : allVideoData;
  const relatedTitleKey = relatedMeta.titleKey;
  const relatedTitleDefault = relatedMeta.titleDefault;
  const wishlistType = video?.type === 'konsert' ? 'konsert' : 'klip';

  const showTrendSectionSkeleton =
    showHeroDataSkeleton || (Boolean(videosLoading) && relatedList.length === 0);
  const trendItemsToRender = showTrendSectionSkeleton ? trendSkeletonItems : relatedList;

  useEffect(() => {
    document.documentElement.classList.add('video-detail-page-lock');
    document.body.classList.add('video-detail-page-active');
    return () => {
      document.documentElement.classList.remove('video-detail-page-lock');
      document.body.classList.remove('video-detail-page-active');
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && video?.video) {
      videoRef.current.load();
    }
  }, [id, video?.video]);

  const handleVideoEnded = () => {
    const idx = relatedList.findIndex((v) => v.id === video?.id);
    if (idx >= 0 && idx < relatedList.length - 1) {
      const next = relatedList[idx + 1];
      navigate(`/music/video/${next.id}`);
    }
  };

  const handleCardClick = (clipId) => {
    navigate(`/music/video/${clipId}`);
  };

  const getArtistName = (artistId) => {
    const a = getArtistById(artistId);
    return a?.name || artistId || '';
  };

  const handleDownload = () => {
    if (!video?.video) return;
    const link = document.createElement('a');
    link.href = video.video;
    link.download = `${video.title || 'video'}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!video && !videosLoading) {
    return (
      <div className="video-detail">
        <div className="video-detail-error">Video topilmadi</div>
      </div>
    );
  }

  return (
    <div
      className={['video-detail', sheetClassNames].filter(Boolean).join(' ')}
      style={sheetStyle}
      aria-busy={showHeroDataSkeleton || undefined}
    >
      <div className="video-detail-container">
        <div className="video-detail-layout">
          <div
            className="video-detail-pin"
            ref={pinRef}
            {...pinTouchHandlers}
          >
            <div className="video-detail-player-wrap">
              {video?.video ? (
                <MusicVideoPlayer
                  ref={videoRef}
                  src={video.video}
                  poster={video.img}
                  autoPlay
                  onEnded={handleVideoEnded}
                  onExpandToggle={isMobileViewport() ? handleExpandToggle : undefined}
                  expanded={isImmersive}
                />
              ) : null}
            </div>
          </div>

          <div
            className="video-detail-body-scroll"
            ref={scrollRef}
            {...scrollTouchHandlers}
          >
            <div className="video-detail-main-scroll">
              <div className="video-detail-top">
              <div
                className={`video-detail-info${showInfoSkeleton ? ' video-detail-info--skeleton' : ''}`}
                aria-busy={showInfoSkeleton || undefined}
              >
                {showInfoSkeleton ? (
                  <>
                    <SkeletonLoader variant="video-detail-info-artist" />
                    <SkeletonLoader variant="video-detail-info-title" />
                  </>
                ) : (
                  <>
                    {artist && <span className="video-detail-artist-name">{artist.name}</span>}
                    {artist && <span className="video-detail-info-sep"> - </span>}
                    <span className="video-detail-title">{video.title}</span>
                  </>
                )}
              </div>

              <div
                className="video-detail-actions"
                aria-busy={showActionsSkeleton || undefined}
              >
                {showActionsSkeleton ? (
                  <div className="video-detail-actions-scroll video-detail-actions--skeleton" aria-hidden="true">
                    {Array.from({ length: ACTION_SKELETON_COUNT }, (_, i) => (
                      <SkeletonLoader
                        key={`video-action-skel-${i}`}
                        variant={i < 2 ? 'video-detail-action-sm' : 'video-detail-action'}
                      />
                    ))}
                  </div>
                ) : (
                  <ScrollTouch className="video-detail-actions-scroll">
                    <LikeButton
                      contentId={String(video.id)}
                      persistKey={`video_${video.id}`}
                      initialLikeCount={parseInt(video.like, 10) || 0}
                      initialDislikeCount={parseInt(video.dislike, 10) || 0}
                      likeMeta={{
                        category: video?.type || 'klip',
                        title: video?.title || '',
                        image: video?.img || '',
                        route: `/music/video/${video.id}`,
                      }}
                    />
                    <button
                      type="button"
                      className="video-detail-action-btn video-detail-download-btn"
                      onClick={handleDownload}
                      aria-label="Yuklab olish"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span>Yuklab olish</span>
                    </button>
                    <div className="video-detail-share-wrap">
                      <ShareButton movie={video} dropdownInPortal label="Ulashish" />
                    </div>
                    <button
                      type="button"
                      className={`video-detail-action-btn video-detail-save-btn ${isInWishlist(video.id, wishlistType) ? 'active' : ''}`}
                      onClick={() => toggleWishlist(video.id, wishlistType)}
                      aria-label="Saqlash"
                    >
                      <svg viewBox="0 0 24 24" fill={isInWishlist(video.id, wishlistType) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>Saqlash</span>
                    </button>
                    <Repost
                      className="video-detail-action-btn video-detail-repost-btn"
                      label="Repost"
                      item={{
                        id: video.id,
                        type: video.type === 'konsert' ? 'konsert' : 'klip',
                        title: video.title || '',
                        artistName: artist?.name || '',
                        image: video.img || '/img/movie1.jpg',
                        route: `/music/video/${video.id}`,
                      }}
                    />
                  </ScrollTouch>
                )}
              </div>
            </div>

            {showArtistCard && (
              <div
                className={`video-detail-artist-card${
                  showArtistCardDataSkeleton ? ' video-detail-artist-card--skeleton' : ''
                }`}
                onClick={() => {
                  if (showArtistCardDataSkeleton) return;
                  if (artist?.id) navigate(`/music/artist/${artist.id}`);
                }}
                style={
                  showArtistCardDataSkeleton || !artist?.id ? { cursor: 'default' } : undefined
                }
                aria-busy={showArtistCardDataSkeleton || showArtistImgSkeleton || undefined}
              >
                {showArtistCardDataSkeleton ? (
                  <>
                    <SkeletonLoader variant="music-detail-artist-card-img" />
                    <div className="video-detail-artist-card-info">
                      <SkeletonLoader variant="music-detail-artist-card-name" />
                      <div className="artist-detail-stat-item video-detail-artist-stat video-detail-artist-stat--skeleton">
                        <SkeletonLoader variant="music-detail-artist-stat-num" />
                        <SkeletonLoader variant="music-detail-artist-stat-label" />
                      </div>
                    </div>
                    <SkeletonLoader
                      variant="music-detail-following-btn"
                      className="video-detail-artist-card-btn"
                    />
                  </>
                ) : (
                  <>
                    <div className="video-detail-artist-card-img-wrap">
                      {showArtistImgSkeleton && (
                        <SkeletonLoader
                          variant="music-detail-artist-card-img"
                          className="video-detail-artist-card-img--skeleton"
                        />
                      )}
                      {artistImgSrc && (
                        <img
                          ref={artistImg.imgRef}
                          src={artistImgSrc}
                          alt={artist.name}
                          className={`video-detail-artist-card-img${
                            showArtistImgSkeleton ? ' video-detail-artist-card-img--loading' : ''
                          }`}
                          onLoad={artistImg.onLoad}
                          onError={artistImg.onError}
                        />
                      )}
                    </div>
                    <div className="video-detail-artist-card-info">
                      <span className="video-detail-artist-card-name">{artist.name}</span>
                      <div className="artist-detail-stat-item video-detail-artist-stat">
                        <span className="artist-detail-track-num">{formatCount(artist.subscribers ?? 0)}</span>
                        <span className="artist-detail-track-label">Obunachi</span>
                      </div>
                    </div>
                    <FollowingButton
                      artistId={artist.id}
                      wrapperClassName="video-detail-artist-card-btn"
                      stopPropagation
                    />
                  </>
                )}
              </div>
            )}

            {video && (
              <MovieComments
                key={String(id)}
                ref={commentsRef}
                movieId={`music:${String(id)}`}
                mobileSheetUi
              />
            )}
            <RecommendedClips
              klip={video}
              titleKey="music.similarClips"
              forceSkeleton={showHeroDataSkeleton}
            />
            <SimilarSongs
              klip={video}
              titleKey="music.recommendedMusic"
              forceSkeleton={showHeroDataSkeleton}
            />
            <AlbumsForYou klip={video} forceSkeleton={showHeroDataSkeleton} />
            </div>

            <div className="video-detail-right-scroll">
              {showTrendSectionSkeleton ? (
                <SkeletonLoader
                  variant="video-detail-trend-title"
                  className="video-detail-trend-title-skeleton"
                />
              ) : (
                <h3 className="video-detail-trend-title">{t(relatedTitleKey, relatedTitleDefault)}</h3>
              )}
              <div className="video-detail-trend-grid">
                {showTrendSectionSkeleton
                  ? trendItemsToRender.map((item) => (
                      <VideoTrendCardSkeleton key={item.id} />
                    ))
                  : trendItemsToRender.map((item) => (
                      <VideoDetailTrendCard
                        key={item.id}
                        item={item}
                        isActive={item.id === video?.id}
                        onClick={() => handleCardClick(item.id)}
                        getArtistName={getArtistName}
                      />
                    ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
