import React from 'react';
import { useNavigate } from 'react-router-dom';
import { allMusicData } from '../../dataMusic/allMusicData';
import { artists } from '../../dataMusic/artists';
import './RepostMusicCard.css';

const RepostMusicCard = ({ item }) => {
  const navigate = useNavigate();
  const open = () => navigate(item.route || `/music/${item.id}`);
  const music = allMusicData.find((m) => String(m.id) === String(item.id));
  const artistName =
    item.artistName ||
    (music?.artistId ? artists.find((a) => a.id === music.artistId)?.name || '' : '');

  return (
    <button type="button" className="repost-music-card" onClick={open}>
      <span className="repost-music-card-disk">
        <img src={item.image || '/img/movie1.jpg'} alt="" className="repost-music-card-img" />
      </span>
      <div className="repost-music-card-text">
        <span className="repost-music-card-title">{item.title || 'Music'}</span>
        <span className="repost-music-card-artist">{artistName}</span>
      </div>
      <div className="repost-music-card-play" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </button>
  );
};

export default RepostMusicCard;
