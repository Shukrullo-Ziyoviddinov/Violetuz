import React from 'react';
import './ComentariaMovieCard.css';

const ComentariaMovieCard = ({ title, image, onClick }) => {
  return (
    <button type="button" className="comentaria-movie-card" onClick={onClick} aria-label={title}>
      <div className="comentaria-movie-card-img-wrap">
        <img src={image || '/img/movie1.jpg'} alt="" className="comentaria-movie-card-img" loading="lazy" />
      </div>
    </button>
  );
};

export default ComentariaMovieCard;
