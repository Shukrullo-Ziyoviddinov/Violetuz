import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ScrollTouch from '../../components/ScrollTouch/ScrollTouch';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMusicApi } from '../../context/MusicApiContext';
import { useRecentlyUploadedMusic } from '../../hooks/useRecentlyUploadedMusic';
import './SearchModalRecentlyUploaded.css';

const PREVIEW_LIMIT = 10;
const MORE_PATH = '/music/more/yangi-yuklanganlar';

const titleOf = (item, contentLang) => {
  if (!item?.title) return '';
  if (typeof item.title === 'object') {
    return item.title[contentLang] || item.title.uz || item.title.ru || item.title.en || '';
  }
  return String(item.title);
};

/**
 * Qidiruv modalidagi “Yangi yuklanganlar”.
 * Ma’lumot: serverdagi uploadedAt, eng yangi 20 ta.
 * To‘liq sahifa: /music/more/yangi-yuklanganlar — musiqa more kartochkalari.
 */
const SearchModalRecentlyUploaded = ({ onNavigateAway }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { allMusic, musicLoading, getArtistById } = useMusicApi();
  const { items, loading } = useRecentlyUploadedMusic();

  const tracks = useMemo(() => {
    const byId = new Map((allMusic || []).map((track) => [String(track.id), track]));
    const out = [];
    for (const row of items) {
      const track = byId.get(String(row.id));
      if (!track) continue;
      out.push(track);
    }
    return out;
  }, [allMusic, items]);

  const preview = tracks.slice(0, PREVIEW_LIMIT);
  const waiting = (loading || musicLoading) && preview.length === 0;

  const artistOf = (item) => {
    const artist = getArtistById?.(item.artistId);
    return artist?.name || item.artist || '';
  };

  const goMore = () => {
    onNavigateAway?.();
    navigate(MORE_PATH);
  };

  const openTrack = (item) => {
    if (item?.id == null) return;
    onNavigateAway?.();
    navigate(`/music/${item.id}?section=yangi-yuklanganlar`);
  };

  if (!waiting && preview.length === 0) return null;

  return (
    <section className="search-modal-recent" aria-busy={waiting || undefined}>
      <div className="search-modal-recent-header">
        <h2 className="search-modal-recent-title">
          {t('music.yangiYuklanganlar', 'Yangi yuklanganlar')}
        </h2>
        <button type="button" className="search-modal-recent-more" onClick={goMore}>
          {t('music.barchasiniKorish', "Barchasini ko'rish")}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M9.3 6.3 14.9 12l-5.6 5.7 1.4 1.4L17.8 12 10.7 4.9z" />
          </svg>
        </button>
      </div>

      <ScrollTouch className="search-modal-recent-list">
        {waiting
          ? Array.from({ length: 4 }, (_, index) => (
              <div
                key={`search-recent-skel-${index}`}
                className="search-modal-recent-card search-modal-recent-card--skeleton"
                aria-hidden="true"
              />
            ))
          : preview.map((item) => {
              const title = titleOf(item, contentLang);
              return (
                <button
                  key={item.id}
                  type="button"
                  className="search-modal-recent-card"
                  onClick={() => openTrack(item)}
                >
                  <span className="search-modal-recent-cover">
                    <img src={item.img || '/img/movie1.jpg'} alt="" />
                  </span>
                  <span className="search-modal-recent-name">{title}</span>
                  <span className="search-modal-recent-artist">{artistOf(item)}</span>
                </button>
              );
            })}
      </ScrollTouch>
    </section>
  );
};

export default SearchModalRecentlyUploaded;
