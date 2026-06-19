import React, { useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWishlist } from '../context/WishlistContext';
import { trendClipsData } from '../dataMusic/trendClipsData';
import { jaxonConcertsData } from '../dataMusic/jaxonConcertsData';
import { visualBeatsData } from '../dataMusic/visualBeatsData';
import { loveAndDesireData } from '../dataMusic/loveAndDesireData';
import { trendVideosData } from '../dataMusic/trendVideosData';
import { stageCreationData } from '../dataMusic/stageCreationData';
import { liveStagesData } from '../dataMusic/liveStagesData';
import { starsStageData } from '../dataMusic/starsStageData';
import { artists } from '../dataMusic/artists';
import { matchId } from '../dataMusic/musicDataUtils';
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
import { formatCount } from '../utils/utils';
import './VideoPage.css';

const CLIP_SOURCES = [
  { data: trendClipsData, titleKey: 'music.trendClips', titleDefault: 'Trend Kliplar' },
  { data: jaxonConcertsData, titleKey: 'music.jacksonConcerts', titleDefault: 'Jaxon konsertlari' },
  { data: liveStagesData, titleKey: 'music.liveStages', titleDefault: 'Jonli sahnalar' },
  { data: starsStageData, titleKey: 'music.starsStage', titleDefault: 'Yulduzlar sahasi' },
  { data: visualBeatsData, titleKey: 'music.visualBeats', titleDefault: 'Visual Beats' },
  { data: loveAndDesireData, titleKey: 'music.sevgiVaIchq', titleDefault: 'Sevgi va ichq' },
  { data: trendVideosData, titleKey: 'music.trendVideos', titleDefault: 'Trenddagi kliplar' },
  { data: stageCreationData, titleKey: 'music.sahnadagiIjod', titleDefault: 'Sahnadagi ijod' },
];
const allVideoData = CLIP_SOURCES.flatMap((s) => s.data);

const VideoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const videoRef = useRef(null);
  const commentsRef = useRef(null);

  const video = allVideoData.find((v) => matchId(v.id, id));
  const artist = video ? artists.find((a) => a.id === video.artistId) : null;
  const source = CLIP_SOURCES.find((s) => s.data.some((v) => v.id === video?.id));
  const relatedList = source?.data || trendClipsData;
  const relatedTitleKey = source?.titleKey || 'music.trendClips';
  const relatedTitleDefault = source?.titleDefault || 'Trend Kliplar';
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
    const a = artists.find((x) => x.id === artistId);
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
                    className="video-detail-download-btn"
                    onClick={handleDownload}
                    aria-label="Yuklab olish"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                  <div className="video-detail-share-wrap">
                    <ShareButton movie={video} dropdownInPortal />
                  </div>
                  <Repost
                    className="video-detail-save-btn"
                    item={{
                      id: video.id,
                      type: video.type === 'konsert' ? 'konsert' : 'klip',
                      title: video.title || '',
                      artistName: artist?.name || '',
                      image: video.img || '/img/movie1.jpg',
                      route: `/music/video/${video.id}`,
                    }}
                  />
                  <button
                    className="video-detail-comment-btn"
                    onClick={() => commentsRef.current?.openModal()}
                    aria-label="Izohlar"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                <button
                  className={`video-detail-save-btn ${isInWishlist(video.id, wishlistType) ? 'active' : ''}`}
                  onClick={() => toggleWishlist(video.id, wishlistType)}
                  aria-label="Sevimlilarga saqlash"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={isInWishlist(video.id, wishlistType) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
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
