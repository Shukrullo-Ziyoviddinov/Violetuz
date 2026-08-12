import React, { useRef, useState } from 'react';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { getLocalizedField } from '../../utils/shortsMovieUtils';
import { useVideoDurationLabel } from './useVideoDurationLabel';
import TrillerSideCardMoreModal from './TrillerSideCardMoreModal';
import './TrillerSideCard.css';

const TrillerSideCard = ({ triller, onSelect }) => {
  const { contentLang } = useContentLanguage();
  const videoSrc = getLocalizedField(triller?.video, contentLang);
  const durationLabel = useVideoDurationLabel(videoSrc);
  const moreBtnRef = useRef(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);

  if (!triller) return null;

  const title = getLocalizedField(triller.title, contentLang);
  const videoImg = getLocalizedField(triller.videoImg, contentLang);
  const ageLimit = triller.ageLimit != null ? Number(triller.ageLimit) : null;
  const ageLabel = Number.isFinite(ageLimit) ? `${ageLimit}+` : '';

  const handleClick = () => {
    onSelect?.(triller);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const handleMore = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = moreBtnRef.current?.getBoundingClientRect?.() || null;
    setAnchorRect(rect ? {
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
      width: rect.width,
      height: rect.height,
    } : null);
    setMoreOpen(true);
  };

  return (
    <>
      <div
        className="triller-side-card"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <div className="triller-side-card-thumb">
          {videoImg ? (
            <img src={videoImg} alt={title} className="triller-side-card-image" loading="lazy" />
          ) : null}
          {ageLabel ? <span className="triller-side-card-age">{ageLabel}</span> : null}
          {durationLabel ? (
            <span className="triller-side-card-duration">{durationLabel}</span>
          ) : null}
        </div>

        <div className="triller-side-card-body">
          <h3 className="triller-side-card-title">{title}</h3>
        </div>

        <button
          ref={moreBtnRef}
          type="button"
          className="triller-side-card-more"
          onClick={handleMore}
          aria-label="Ko'proq"
          aria-haspopup="menu"
          aria-expanded={moreOpen}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="5" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="12" cy="19" r="1.6" />
          </svg>
        </button>
      </div>

      <TrillerSideCardMoreModal
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        anchorRect={anchorRect}
        trillerId={triller.id}
        title={title}
      />
    </>
  );
};

export default TrillerSideCard;
