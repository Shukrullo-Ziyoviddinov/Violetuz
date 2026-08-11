import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { getLocalizedField } from '../../utils/shortsMovieUtils';
import { fetchAllTrillers } from '../../api/trillersApi';
import VideoPlayerControls from '../VideoPlayerControls/VideoPlayerControls';
import TrillerSideCard from './TrillerSideCard';
import './Triller.css';

const Triller = ({ activeId }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();

  const { data: list = [], isPending, isError } = useQuery({
    queryKey: ['trillers'],
    queryFn: fetchAllTrillers,
  });

  const activeTriller = useMemo(() => {
    if (!list.length) return null;
    const found = list.find((item) => String(item.id) === String(activeId));
    return found || list[0];
  }, [list, activeId]);

  const sideTrillers = useMemo(() => {
    if (!activeTriller) return list;
    return list.filter((item) => item.id !== activeTriller.id);
  }, [list, activeTriller]);

  const videoSrc = getLocalizedField(activeTriller?.video, contentLang);
  const title = getLocalizedField(activeTriller?.title, contentLang);
  const poster = getLocalizedField(activeTriller?.videoImg, contentLang);
  const forYouTitle = t('triller.forYou', 'Sizga yoqadi');

  const handleSelect = (item) => {
    if (!item?.id) return;
    navigate(`/triller/${item.id}`, { replace: true });
  };

  if (isPending) {
    return (
      <div className="triller triller--empty">
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  if (isError || !activeTriller) {
    return (
      <div className="triller triller--empty">
        <p>Triller topilmadi</p>
      </div>
    );
  }

  return (
    <div className="triller">
      <div className="triller-main">
        {/* Pin: faqat video — joyida */}
        <div className="triller-pin">
          <div className="triller-player-frame">
            <VideoPlayerControls
              src={videoSrc ? encodeURI(videoSrc) : ''}
              poster={poster || undefined}
              resetKey={activeTriller.id}
              videoClassName="trailer-modal-video"
              objectFit="cover"
            />
          </div>
        </div>

        {/* Scroll: title → keyin sticky "Sizga yoqadi" → kartochkalar */}
        <div className="triller-scroll-area">
          {title ? <h1 className="triller-player-title">{title}</h1> : null}

          <h2 className="triller-side-title triller-side-title--pin">{forYouTitle}</h2>

          <aside className="triller-side">
            <h2 className="triller-side-title triller-side-title--side">{forYouTitle}</h2>
            <div className="triller-side-list">
              {sideTrillers.map((item) => (
                <TrillerSideCard key={item.id} triller={item} onSelect={handleSelect} />
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Triller;
