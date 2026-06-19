import React from 'react';
import './ComentariaVideoCard.css';

const ComentariaVideoCard = ({ title, image, badge, onClick }) => {
  return (
    <button type="button" className="comentaria-video-card" onClick={onClick} aria-label={title}>
      <div className="comentaria-video-card-img-wrap">
        <img src={image || '/img/movie1.jpg'} alt="" className="comentaria-video-card-img" loading="lazy" />
        {badge ? <span className="comentaria-video-card-badge">{badge}</span> : null}
      </div>
    </button>
  );
};

export default ComentariaVideoCard;
