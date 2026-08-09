import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { getLocalizedField } from '../../utils/shortsMovieUtils';
import TrillerCard from './TrillerCard';
import trillersData from '../../data/triller.json';
import './Triller.css';

const Triller = ({ activeId }) => {
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const list = Array.isArray(trillersData) ? trillersData : [];

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

  const handleSelect = (item) => {
    if (!item?.id) return;
    navigate(`/triller/${item.id}`, { replace: true });
  };

  if (!activeTriller) {
    return (
      <div className="triller triller--empty">
        <p>Triller topilmadi</p>
      </div>
    );
  }

  return (
    <div className="triller">
      <div className="triller-main">
        <div className="triller-player">
          {videoSrc ? (
            <video
              key={activeTriller.id}
              className="triller-player-video"
              src={videoSrc}
              controls
              playsInline
              poster={getLocalizedField(activeTriller.videoImg, contentLang) || undefined}
            />
          ) : null}
          {title ? <h1 className="triller-player-title">{title}</h1> : null}
        </div>

        <aside className="triller-side">
          <div className="triller-side-list">
            {sideTrillers.map((item) => (
              <TrillerCard
                key={item.id}
                triller={item}
                className="triller-card--side"
                onSelect={handleSelect}
              />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Triller;
