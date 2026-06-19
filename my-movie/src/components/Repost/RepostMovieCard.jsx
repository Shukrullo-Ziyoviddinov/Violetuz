import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RepostMovieCard.css';

const RepostMovieCard = ({ item }) => {
  const navigate = useNavigate();
  const open = () => navigate(item.route || `/movie/${item.id}`);
  return (
    <button type="button" className="repost-movie-card" onClick={open}>
      <div className="repost-movie-card-image-wrapper">
        <img src={item.image || '/img/movie1.jpg'} alt="" className="repost-movie-card-img" />
        <div className="repost-movie-card-badge repost-movie-card-badge-fhd">FHD</div>
        {item.rating != null && item.rating !== '' && (
          <div className="repost-movie-card-rating">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffd700" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>{item.rating}</span>
          </div>
        )}
      </div>
    </button>
  );
};

export default RepostMovieCard;
