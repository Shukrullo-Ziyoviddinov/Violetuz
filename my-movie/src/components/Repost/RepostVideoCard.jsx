import React from 'react';
import { useNavigate } from 'react-router-dom';
import { allClipsData, allConcertsData } from '../../dataMusic/wishlistDataConfig';
import { artists } from '../../dataMusic/artists';
import './RepostVideoCard.css';

const RepostVideoCard = ({ item }) => {
  const navigate = useNavigate();
  const open = () => navigate(item.route || `/music/video/${item.id}`);
  const source = item.type === 'konsert' ? allConcertsData : allClipsData;
  const raw = source.find((v) => Number(v.id) === Number(item.id));
  const artistName =
    item.artistName ||
    (raw?.artistId ? artists.find((a) => a.id === raw.artistId)?.name || '' : '');
  return (
    <button type="button" className="repost-video-card" onClick={open}>
      <div className="music-more-page-item-image-wrapper">
        <img src={item.image || '/img/movie1.jpg'} alt="" className="music-more-page-item-image" />
        <div className="music-more-page-item-play">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21" />
          </svg>
        </div>
        <div className="music-more-page-item-info">
          <h3 className="music-more-page-item-title">{item.title || 'Nomsiz element'}</h3>
          <p className="music-more-page-item-artist">{artistName}</p>
        </div>
      </div>
    </button>
  );
};

export default RepostVideoCard;
