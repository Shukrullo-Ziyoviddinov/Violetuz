import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useContentLanguage } from '../../context/ContentLanguageContext';
import { searchMusicByQuery, addMusicSearchHistory } from '../../utils/searchMusic';
import { artists } from '../../dataMusic/artists';
import ScrollTouch from '../../components/ScrollTouch/ScrollTouch';
import './SearchMusicResults.css';

const SearchMusicResults = ({ query, onItemClick }) => {
  const { t } = useTranslation();
  const { contentLang } = useContentLanguage();
  const navigate = useNavigate();

  const results = searchMusicByQuery(query, contentLang, 40);

  const getTitle = (item) => {
    if (item?.itemType === 'artist') return item.name || '';
    if (!item?.title) return '';
    if (typeof item.title === 'object') {
      return item.title[contentLang] || item.title.uz || item.title.ru || item.title.en || '';
    }
    return String(item.title);
  };

  const getArtistName = (item) => {
    if (item?.itemType === 'artist') return '';
    if (item?.artistId) {
      const artist = artists.find((a) => a.id === item.artistId);
      return artist?.name || item.artistId || '';
    }
    return item?.artist || '';
  };

  const grouped = results.reduce((acc, item) => {
    const type = item.itemType || 'music';
    const key = type === 'clip' ? (item.type === 'konsert' ? 'konsert' : 'klip') : type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const sectionOrder = ['music', 'artist', 'album', 'klip', 'konsert'];

  const handleClick = (item) => {
    addMusicSearchHistory(item, getTitle, getArtistName);
    if (onItemClick) onItemClick();
    if (item.itemType === 'artist') {
      navigate(`/music/artist/${item.id}`);
    } else if (item.itemType === 'album') {
      navigate(`/music/album/${item.id}`);
    } else if (item.itemType === 'klip' || item.itemType === 'konsert' || item.itemType === 'clip') {
      navigate(`/music/video/${item.id}`);
    } else {
      navigate(`/music/${item.id}`);
    }
  };

  if (!query?.trim()) return null;

  const sectionLabels = {
    music: t('music.searchTypeMusic', 'Musiqa'),
    artist: t('music.searchTypeArtist', 'Artistlar'),
    album: t('music.searchTypeAlbum', 'Albom'),
    klip: t('music.searchTypeClip', 'Klip'),
    konsert: t('music.searchTypeConcert', 'Konsert'),
  };

  return (
    <div className="search-music-results">
      {sectionOrder.map((key) => {
        const items = grouped[key] || [];
        if (items.length === 0) return null;
        const isVideo = key === 'klip' || key === 'konsert';
        const imgSrc = (it) => (it.itemType === 'artist' ? (it.imgArtist || it.img) : it.img) || '/img/movie1.jpg';
        return (
          <div key={key} className="search-music-results-section">
            <h4 className="search-music-results-section-title">{sectionLabels[key]}</h4>
            {key === 'artist' ? (
              <ScrollTouch className="search-music-results-scroll">
                <div className="search-music-results-horizontal">
                  {items.map((item) => (
                    <div
                      key={`${item.itemType || 'music'}-${item.id}`}
                      className="search-music-results-item search-music-results-item--artist"
                      onClick={() => handleClick(item)}
                    >
                      <div className="search-music-results-item-image-wrapper">
                        <img
                          src={(item.imgArtist || item.img) || '/img/movie1.jpg'}
                          alt={getTitle(item)}
                          className="search-music-results-item-image"
                        />
                      </div>
                      <div className="search-music-results-item-info">
                        <span className="search-music-results-item-title">{getTitle(item)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollTouch>
            ) : isVideo ? (
              <ScrollTouch className="search-music-results-scroll">
                <div className="search-music-results-horizontal">
                  {items.map((item) => (
                    <div
                      key={`${item.itemType || 'music'}-${item.id}`}
                      className="search-music-results-item search-music-results-item--video"
                      onClick={() => handleClick(item)}
                    >
                      <div className="search-music-results-item-image-wrapper">
                        <img
                          src={item.imgArtist || item.img || '/img/movie1.jpg'}
                          alt={getTitle(item)}
                          className="search-music-results-item-image"
                        />
                        <div className="search-music-results-item-info">
                          <span className="search-music-results-item-title">{getTitle(item)}</span>
                          <span className="search-music-results-item-artist">{getArtistName(item)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollTouch>
            ) : (
              <div className="search-music-results-grid">
                {items.map((item) => (
                  <div
                    key={`${item.itemType || 'music'}-${item.id}`}
                    className="search-music-results-item"
                    onClick={() => handleClick(item)}
                  >
                    <div className="search-music-results-item-image-wrapper">
                      <img
                        src={(item.itemType === 'artist' ? (item.imgArtist || item.img) : item.img) || '/img/movie1.jpg'}
                        alt={getTitle(item)}
                        className="search-music-results-item-image"
                      />
                      <div className="search-music-results-item-info">
                        <span className="search-music-results-item-title">{getTitle(item)}</span>
                        <span className="search-music-results-item-artist">{getArtistName(item)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {results.length === 0 && (
        <p className="search-music-results-empty">{t('searchModal.noResults', 'Natija topilmadi')}</p>
      )}
    </div>
  );
};

export default SearchMusicResults;
