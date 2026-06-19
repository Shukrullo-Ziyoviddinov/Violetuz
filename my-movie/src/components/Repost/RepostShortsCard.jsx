import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RepostShortsCard.css';

const RepostShortsCard = ({ item, scopeEntries, scopeIndex = 0 }) => {
  const navigate = useNavigate();
  const open = () => {
    const base = item.type === 'musicshorts' ? '/music/shorts' : '/shorts';
    if (scopeEntries?.length) {
      const params = new URLSearchParams();
      params.set('repostShorts', scopeEntries.map((e) => `${e.type}:${e.id}`).join(','));
      const idx = Number.isFinite(scopeIndex) && scopeIndex >= 0 ? scopeIndex : 0;
      params.set('startIndex', String(idx));
      navigate(`${base}?${params.toString()}`);
      return;
    }
    navigate(item.route || base);
  };

  return (
    <div className="repost-shorts-card">
      <div className="repost-shorts-card-image-wrapper">
        <button
          type="button"
          className="repost-shorts-card-img-hit"
          onClick={open}
          aria-label={item.title || 'Shorts'}
        >
          {item.videoUrl ? (
            <video
              src={item.videoUrl}
              className="repost-shorts-card-img"
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
            />
          ) : (
            <img src={item.image || '/img/movie1.jpg'} alt="" className="repost-shorts-card-img" />
          )}
        </button>
        <div className="repost-shorts-card-info">
          <h3 className="shorts-modal-title">{item.title || 'Shorts'}</h3>
        </div>
      </div>
    </div>
  );
};

export default RepostShortsCard;
