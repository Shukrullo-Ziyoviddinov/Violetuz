import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { getLocalizedField } from '../../utils/shortsMovieUtils';
import { fetchAllTrillers } from '../../api/trillersApi';
import VideoPlayerControls from '../VideoPlayerControls/VideoPlayerControls';
import TrillerSideCard from './TrillerSideCard';
import MediaGenreFilter from './MediaGenreFilter';
import './Triller.css';

const Triller = ({ activeId }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const scrollRef = useRef(null);
  const mobileTitleRef = useRef(null);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [showGenreFilter, setShowGenreFilter] = useState(false);

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

  const genreOptions = useMemo(() => {
    const map = new Map();
    for (const item of list) {
      const genre = item?.trillerGenre;
      if (!genre || typeof genre !== 'object') continue;
      const id = String(genre.uz || genre.ru || '').trim();
      if (!id || map.has(id)) continue;
      map.set(id, {
        id,
        label: getLocalizedField(genre, contentLang) || id,
      });
    }
    return Array.from(map.values());
  }, [list, contentLang]);

  const filteredSideTrillers = useMemo(() => {
    if (selectedGenre === 'all') return sideTrillers;
    return sideTrillers.filter(
      (item) => String(item?.trillerGenre?.uz || '').trim() === selectedGenre
    );
  }, [sideTrillers, selectedGenre]);

  const videoSrc = getLocalizedField(activeTriller?.video, contentLang);
  const title = getLocalizedField(activeTriller?.title, contentLang);
  const poster = getLocalizedField(activeTriller?.videoImg, contentLang);
  const forYouTitle = t('triller.forYou', 'Sizga yoqadi');

  useEffect(() => {
    setSelectedGenre('all');
    setShowGenreFilter(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activeTriller?.id]);

  /* Mobile: title scroll qilib chiqib ketganda sticky «Sizga yoqadi» → genre */
  useEffect(() => {
    const root = scrollRef.current;
    const titleEl = mobileTitleRef.current;
    if (!root || !titleEl || isPending) return undefined;

    const update = () => {
      const rootTop = root.getBoundingClientRect().top;
      const titleBottom = titleEl.getBoundingClientRect().bottom;
      setShowGenreFilter(titleBottom <= rootTop + 2);
    };

    update();
    root.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      root.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [activeTriller?.id, isPending, title]);

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
        <div className="triller-primary">
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
          {title ? (
            <h1 className="triller-player-title triller-player-title--desktop">{title}</h1>
          ) : null}
        </div>

        <div className="triller-scroll-area" ref={scrollRef}>
          {title ? (
            <h1
              ref={mobileTitleRef}
              className="triller-player-title triller-player-title--mobile"
            >
              {title}
            </h1>
          ) : null}

          <div
            className={`triller-sticky-bar${showGenreFilter ? ' is-filter' : ''}`}
          >
            <h2 className="triller-side-title triller-side-title--pin triller-sticky-title">
              {forYouTitle}
            </h2>
            <div className="triller-sticky-filter" aria-hidden={!showGenreFilter}>
              <MediaGenreFilter
                genres={genreOptions}
                selectedId={selectedGenre}
                onSelect={setSelectedGenre}
              />
            </div>
          </div>

          <aside className="triller-side">
            <h2 className="triller-side-title triller-side-title--side">{forYouTitle}</h2>
            <div className="triller-side-list">
              {filteredSideTrillers.map((item) => (
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
