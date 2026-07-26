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
import MusicVideoPlayer from '../Music/MusicVideoPlayer/MusicVideoPlayer';
import VideoDetailTrendCard from './VideoDetailTrendCard';
import MovieComments from '../components/MovieDetail/MovieComments';
import RecommendedClips from '../Music/RecommendedClips/RecommendedClips';
import SimilarSongs from '../Music/SimilarSongs/SimilarSongs';
import AlbumsForYou from '../Music/AlbumsForYou/AlbumsForYou';
import { formatCount } from '../utils/utils';
import './VideoPage.css';

const VideoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { allClips, allConcerts, clipSections, concertSections, getClipsByCategory, getConcertsByCategory, getArtistById } = useMusicApi();
  const videoRef = useRef(null);
  const commentsRef = useRef(null);

  const allVideoData = useMemo(
    () => [...(Array.isArray(allClips) ? allClips : []), ...(Array.isArray(allConcerts) ? allConcerts : [])],
    [allClips, allConcerts]
  );

  const video = allVideoData.find((v) => matchId(v.id, id));
  const artist = video ? getArtistById(video.artistId) : null;

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

  if (!video) {
    return (
      <div className="video-detail">
        <div className="video-detail-error">Video topilmadi</div>
      </div>
    );
  }

  return (
    <div className="video-detail">
      <div className="video-detail-container">
        <div className="video-detail-layout">
          <div className="video-detail-left-scroll">
            <div className="video-detail-top">
              <div className="video-detail-player-wrap">
                <MusicVideoPlayer
                  ref={videoRef}
                  src={video.video}
                  poster={video.img}
                  autoPlay
                  onEnded={handleVideoEnded}
                />
              </div>
              <div className="video-detail-info">
                {artist && <span className="video-detail-artist-name">{artist.name}</span>}
                {artist && <span className="video-detail-info-sep"> - </span>}
                <span className="video-detail-title">{video.title}</span>
              </div>
              <div className="video-detail-actions">
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
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span>Saqlash</span>
                  </button>
                </ScrollTouch>
              </div>
            </div>
            {artist && (
              <div
                className="video-detail-artist-card"
                onClick={() => navigate(`/music/artist/${artist.id}`)}
              >
                <img
                  src={artist.imgArtist || artist.img || '/img/movie1.jpg'}
                  alt={artist.name}
                  className="video-detail-artist-card-img"
                />
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
              </div>
            )}
            {/* Kalit: URL :id (music:301) — sahifa yangilanganda ham bir xil; commentsApi da mv_ dan ko'chirish */}
            <MovieComments key={String(id)} ref={commentsRef} movieId={`music:${String(id)}`} />
            <RecommendedClips klip={video} titleKey="music.similarClips" />
            <SimilarSongs klip={video} titleKey="music.recommendedMusic" />
            <AlbumsForYou klip={video} />
          </div>
          <div className="video-detail-right-scroll">
            <h3 className="video-detail-trend-title">{t(relatedTitleKey, relatedTitleDefault)}</h3>
            <div className="video-detail-trend-grid">
              {relatedList.map((item) => (
                <VideoDetailTrendCard
                  key={item.id}
                  item={item}
                  isActive={item.id === video.id}
                  onClick={() => handleCardClick(item.id)}
                  getArtistName={getArtistName}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
