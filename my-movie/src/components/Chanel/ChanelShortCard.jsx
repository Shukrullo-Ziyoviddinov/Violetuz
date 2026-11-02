import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import ShortsVideoThumb from '../ShortsVideos/ShortsVideoThumb';
import ViewCount from '../ViewCount/ViewCount';
import '../ShortsVideos/ShortsVideos.css';

const ChanelShortCard = ({ item, layout = 'grid' }) => {
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const videoSrc = item?.video?.[contentLang] || item?.video?.uz || item?.video?.ru || '';
  const row = layout === 'row';

  const open = () => {
    if (item?.id == null) return;
    navigate(`/shorts?shortId=${item.id}`);
  };

  return (
    <div
      className={`shorts-video-card chanel-short-card${row ? ' chanel-short-card--row' : ''}`}
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      }}
    >
      <ShortsVideoThumb videoSrc={videoSrc} still>
        {item?.id != null ? (
          <ViewCount
            itemId={item.id}
            type="movieShorts"
            variant="icon"
            record={false}
            className="shorts-video-card-views"
          />
        ) : null}
      </ShortsVideoThumb>
    </div>
  );
};

export default ChanelShortCard;
