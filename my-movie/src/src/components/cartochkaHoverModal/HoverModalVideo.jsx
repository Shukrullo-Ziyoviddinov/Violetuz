import React from 'react';
import MusicVideoPlayer from '../../Music/MusicVideoPlayer/MusicVideoPlayer';
import LikeButton from '../../Music/LikeButton/LikeButton';
import './HoverModalVideo.css';

/**
 * Hover modal ichida video kartochkasi.
 * MusicVideoPlayer, LikeButton, video-detail-download-btn.
 */
const HoverModalVideo = ({ item, getArtistText }) => {
  if (!item?.video) return null;

  const artist = typeof getArtistText === 'function' ? getArtistText(item) : (item.artist || '');

  const handleDownload = (e) => {
    e.stopPropagation();
    if (!item?.video) return;
    const link = document.createElement('a');
    link.href = item.video;
    link.download = `${item.title || 'video'}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="hover-modal-video">
      <div className="hover-modal-video-card">
        <div className="hover-modal-video-wrapper">
          <MusicVideoPlayer
            src={item.video}
            poster={item.img}
            autoPlay
          />
        </div>
        <div className="hover-modal-video-info">
          <p className="hover-modal-video-artist">{artist}</p>
          <h3 className="hover-modal-video-title">{item.title}</h3>
        </div>
        <div className="hover-modal-video-actions">
          <LikeButton
            contentId={String(item.id)}
            initialLikeCount={parseInt(item.like, 10) || 0}
            initialDislikeCount={parseInt(item.dislike, 10) || 0}
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
        </div>
      </div>
    </div>
  );
};

export default HoverModalVideo;
