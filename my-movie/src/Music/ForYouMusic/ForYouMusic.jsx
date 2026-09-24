import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { useMusicApi } from '../../context/MusicApiContext';
import { useMusicHomeFeed } from '../../hooks/useMusicHomeFeed';
import HorizontalScroll from '../../components/HorizontalScroll/HorizontalScroll';
import MusicButtonMore from '../MusicButtonMore/MusicButtonMore';
import CartochkaHoverModal from '../../components/cartochkaHoverModal';
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';
import { ForYouMusicCard, ForYouMusicCardSkeleton } from './ForYouMusicCard';
import '../MusicCards/MusicCards.css';

const HOME_LIMIT = 10;
const MORE_PATH = '/music/more/sizga-mos-musiqalar';

const artistTextOf = (item, getArtistById) => {
  const artist = getArtistById?.(item?.artistId);
  return artist?.name || item?.artist || item?.artistId || '';
};

const titleOf = (item, contentLang) => {
  if (!item?.title) return '';
  if (typeof item.title === 'object') {
    return item.title[contentLang] || item.title.uz || item.title.ru || item.title.en || '';
  }
  return String(item.title);
};

const ForYouMusic = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { contentLang } = useContentLanguage();
  const { allMusic, getArtistById, musicLoading } = useMusicApi();
  const { items, isLoading } = useMusicHomeFeed();

  const tracks = useMemo(() => {
    const byId = new Map((allMusic || []).map((track) => [String(track.id), track]));
    const out = [];
    for (const row of items) {
      const track = byId.get(String(row.contentId));
      if (!track) continue;
      out.push(track);
    }
    return out;
  }, [allMusic, items]);

  const waiting = (isLoading || musicLoading) && tracks.length === 0;
  if (!waiting && tracks.length === 0) return null;

  const visible = tracks.slice(0, HOME_LIMIT);

  return (
    <div className="music-cards music-cards--sizga-mos-musiqalar" aria-busy={waiting || undefined}>
      <div className="music-cards-container">
        <div className="music-cards-header">
          {waiting ? (
            <SkeletonLoader variant="music-cards-title" className="music-cards-title-skeleton" />
          ) : (
            <h2 className="music-cards-title">
              <span className="music-cards-title-text">
                {t('music.forYouMusic', 'Siz uchun mos musiqalar')}
              </span>
            </h2>
          )}
        </div>
        <div className="music-cards-content">
          <HorizontalScroll>
            {waiting
              ? Array.from({ length: HOME_LIMIT }, (_, index) => (
                  <ForYouMusicCardSkeleton key={`for-you-music-skel-${index}`} />
                ))
              : visible.map((item) => (
                  <CartochkaHoverModal
                    key={item.id}
                    item={item}
                    getTitle={(track) => titleOf(track, contentLang)}
                    getArtistText={(track) => artistTextOf(track, getArtistById)}
                  >
                    <ForYouMusicCard
                      item={item}
                      contentLang={contentLang}
                      artistText={artistTextOf(item, getArtistById)}
                      onOpen={(id) => navigate(`/music/${id}?section=sizga-mos-musiqalar`)}
                    />
                  </CartochkaHoverModal>
                ))}
            {!waiting && tracks.length > 0 ? <MusicButtonMore to={MORE_PATH} /> : null}
          </HorizontalScroll>
        </div>
      </div>
    </div>
  );
};

export default ForYouMusic;
