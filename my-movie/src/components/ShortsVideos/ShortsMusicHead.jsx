import React from 'react';
import { Link } from 'react-router-dom';
import { getLocalizedField } from '../../utils/shortsMovieUtils';
import { getShortsMusicLinkPath } from '../../utils/resolveShortsMusicMeta';

const ShortsMusicHead = ({ item, contentLang = 'uz', onWatchClick }) => {
  const title = getLocalizedField(item?.title, contentLang);
  const artist = getLocalizedField(item?.artist, contentLang);
  const img = item?.musicImg;

  if (!title && !artist && !img) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    onWatchClick?.();
  };

  const inner = (
    <>
      {img ? (
        <img src={img} alt="" className="shorts-modal-music-poster" />
      ) : null}
      <div className="shorts-modal-music-meta">
        {title ? (
          <div className="shorts-modal-music-title-row">
            <h3 className="shorts-modal-title">{title}</h3>
          </div>
        ) : null}
        {artist ? (
          <div className="shorts-modal-music-artist">{artist}</div>
        ) : null}
      </div>
    </>
  );

  if (item?.musicId == null) {
    return <div className="shorts-modal-music-head">{inner}</div>;
  }

  return (
    <Link
      to={getShortsMusicLinkPath(item)}
      className="shorts-modal-music-head"
      onClick={handleClick}
      aria-label={title || artist || undefined}
    >
      {inner}
    </Link>
  );
};

export default ShortsMusicHead;
