import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMusicApi } from '../../context/MusicApiContext';
import { useChannelMusicHomeFeed } from '../../hooks/useChannelMusicHomeFeed';
import { formatArtistNames } from '../../pageMusic/useArtistCycle';
import '../../Music/SearchMusicResults/SearchModalForYou.css';

const PREVIEW_LIMIT = 10;

const sameChannel = (track, channelId) =>
  String(track?.channelId || '') === String(channelId || '');

const titleOf = (item, contentLang) => {
  if (!item?.title) return '';
  if (typeof item.title === 'object') {
    return item.title[contentLang] || item.title.uz || item.title.ru || item.title.en || '';
  }
  return String(item.title);
};

const ChanelSearchForYou = ({ channelId, onShowAll, onOpen }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { allMusic, musicLoading, getArtistById } = useMusicApi();
  const { items, isLoading } = useChannelMusicHomeFeed({
    channelId,
    enabled: Boolean(channelId),
  });

  const tracks = useMemo(() => {
    const byId = new Map(
      (allMusic || [])
        .filter((track) => sameChannel(track, channelId))
        .map((track) => [String(track.id), track])
    );
    const out = [];
    for (const row of items) {
      const track = byId.get(String(row.contentId));
      if (track) out.push(track);
    }
    return out;
  }, [allMusic, channelId, items]);

  const preview = tracks.slice(0, PREVIEW_LIMIT);
  const waiting = (isLoading || musicLoading) && preview.length === 0;
  if (!waiting && preview.length === 0) return null;

  const artistOf = (item) =>
    formatArtistNames(item?.artistId, getArtistById) || item?.artist || '';

  const showAll = () => {
    onShowAll?.(tracks.map((track) => track.id));
  };

  const openTrack = (item) => {
    if (item?.id == null) return;
    onOpen?.();
    navigate(`/music/${item.id}`);
  };

  return (
    <section className="search-modal-foryou" aria-busy={waiting || undefined}>
      <div className="search-modal-foryou-header">
        <h2 className="search-modal-foryou-title">
          {t('music.sizUchunTavsiyalar', 'Siz uchun tavsiyalar')}
        </h2>
        {!waiting && tracks.length > 0 ? (
          <button type="button" className="search-modal-foryou-more" onClick={showAll}>
            {t('music.barchasiniKorish', "Barchasini ko'rish")}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M9.3 6.3 14.9 12l-5.6 5.7 1.4 1.4L17.8 12 10.7 4.9z" />
            </svg>
          </button>
        ) : null}
      </div>

      <ScrollTouch className="search-modal-foryou-list">
        {waiting
          ? Array.from({ length: 4 }, (_, index) => (
            <div
              key={`channel-foryou-skel-${index}`}
              className="search-modal-foryou-card search-modal-foryou-card--skeleton"
              aria-hidden="true"
            />
          ))
          : preview.map((item) => (
            <button
              key={item.id}
              type="button"
              className="search-modal-foryou-card"
              onClick={() => openTrack(item)}
            >
              <span className="search-modal-foryou-cover">
                <img src={item.img || '/img/movie1.jpg'} alt="" />
              </span>
              <span className="search-modal-foryou-name">{titleOf(item, contentLang)}</span>
              <span className="search-modal-foryou-artist">{artistOf(item)}</span>
            </button>
          ))}
      </ScrollTouch>
    </section>
  );
};

export default ChanelSearchForYou;
