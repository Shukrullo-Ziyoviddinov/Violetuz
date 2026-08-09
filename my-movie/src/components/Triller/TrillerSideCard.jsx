import React from 'react';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { getLocalizedField } from '../../utils/shortsMovieUtils';
import { useVideoDurationLabel } from './useVideoDurationLabel';
import './TrillerSideCard.css';

const TrillerSideCard = ({ triller, onSelect }) => {
  const { contentLang } = useContentLanguage();
  const videoSrc = getLocalizedField(triller?.video, contentLang);
  const durationLabel = useVideoDurationLabel(videoSrc);

  if (!triller) return null;

  const title = getLocalizedField(triller.title, contentLang);
  const videoImg = getLocalizedField(triller.videoImg, contentLang);
  const ageLimit = triller.ageLimit != null ? Number(triller.ageLimit) : null;
  const ageLabel = Number.isFinite(ageLimit) ? `${ageLimit}+` : '';

  const handleClick = () => {
    onSelect?.(triller);
  };

  const handleMore = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <button type="button" className="triller-side-card" onClick={handleClick}>
      <div className="triller-side-card-thumb">
        {videoImg ? (
          <img src={videoImg} alt={title} className="triller-side-card-image" loading="lazy" />
        ) : null}
        {ageLabel ? <span className="triller-side-card-age">{ageLabel}</span> : null}
        {durationLabel ? <span className="triller-side-card-duration">{durationLabel}</span> : null}
      </div>

      <div className="triller-side-card-body">
        <h3 className="triller-side-card-title">{title}</h3>
      </div>

      <span
        className="triller-side-card-more"
        role="presentation"
        onClick={handleMore}
        aria-hidden="true"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </span>
    </button>
  );
};

export default TrillerSideCard;
