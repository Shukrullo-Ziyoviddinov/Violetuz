import React from 'react';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import ShortsVideoThumb from '../ShortsVideos/ShortsVideoThumb';
import ViewCount from '../ViewCount/ViewCount';
import '../ShortsVideos/ShortsVideos.css';
import './SearchShortsCard.css';

/**
 * Qidiruv shortsi. Kanal ham shu kartochkani chaqiradi, hozir faqat katta qidiruv.
 * Tarix bu yerda yozilmaydi.
 */
const SearchShortsCard = ({ item, onOpen }) => {
  const { contentLang } = useContentLanguage();
  const videoSrc = item?.video?.[contentLang] || item?.video?.uz || item?.video?.ru || '';
  const viewType = item?.type === 'musicshorts' ? 'musicshorts' : 'movieShorts';

  const open = () => {
    if (item?.id == null) return;
    onOpen?.(item);
  };

  return (
    <div
      className="shorts-video-card search-shorts-card"
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
            type={viewType}
            variant="icon"
            record={false}
            className="shorts-video-card-views"
          />
        ) : null}
      </ShortsVideoThumb>
    </div>
  );
};

export default SearchShortsCard;
