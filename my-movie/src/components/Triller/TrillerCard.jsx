import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { getLocalizedField } from '../../utils/shortsMovieUtils';
import './TrillerCard.css';

const TrillerCard = ({ triller, className = '', onSelect }) => {
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();

  if (!triller) return null;

  const title = getLocalizedField(triller.title, contentLang);
  const videoImg = getLocalizedField(triller.videoImg, contentLang);

  const handleClick = () => {
    if (onSelect) {
      onSelect(triller);
      return;
    }
    navigate(`/triller/${triller.id}`);
  };

  return (
    <button
      type="button"
      className={`triller-card ${className}`.trim()}
      onClick={handleClick}
    >
      <div className="triller-card-image-wrap">
        {videoImg ? (
          <img src={videoImg} alt={title} className="triller-card-image" loading="lazy" />
        ) : null}
      </div>
      {title ? <h3 className="triller-card-title">{title}</h3> : null}
    </button>
  );
};

export default TrillerCard;
