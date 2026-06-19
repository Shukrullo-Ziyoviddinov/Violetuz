import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FeedMusicCard.css';

const activateKey = (e) => e.key === 'Enter' || e.key === ' ';

const FeedMusicCard = ({ item }) => {
  const navigate = useNavigate();

  const openArtist = () => navigate(`/music/artist/${item.artistId}`);

  const openMusicDetail = () => {
    const section = item.musicSectionId ? `?section=${encodeURIComponent(item.musicSectionId)}` : '';
    if (item.trackId != null) {
      navigate(`/music/${item.trackId}${section}`);
      return;
    }
    if (item.albumId != null) {
      navigate(`/music/album/${item.albumId}${section}`);
    }
  };

  return (
    <div className="feed-music-card">
      <div
        className="feed-music-card-profile"
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          openArtist();
        }}
        onKeyDown={(e) => {
          if (activateKey(e)) {
            e.preventDefault();
            openArtist();
          }
        }}
      >
        <img src={item.artistImage} alt={item.artistName} className="feed-music-card-avatar" />
        <div className="feed-music-card-profile-text">
          <div className="feed-music-card-name">
            <span className="feed-music-card-name-text">{item.artistName}</span>
            <img src="/img/galichka.png" alt="" className="feed-artist-name-verified" aria-hidden />
          </div>
          <div className="feed-music-card-type">Music artist</div>
        </div>
      </div>

      <div
        className="feed-music-card-track"
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          openMusicDetail();
        }}
        onKeyDown={(e) => {
          if (activateKey(e)) {
            e.preventDefault();
            openMusicDetail();
          }
        }}
      >
        <img src={item.cover} alt={item.title} className="feed-music-card-cover" />
        <div className="feed-music-card-track-info">
          <div className="feed-music-card-artist">{item.artistName}</div>
          <div className="feed-music-card-track-name">{item.trackTitle}</div>
        </div>
        <div className="feed-music-card-play">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default FeedMusicCard;
