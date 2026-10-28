import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ScrollTouch from '../../components/ScrollTouch/ScrollTouch';
import { useMusicApi } from '../../context/MusicApiContext';
import { usePopularArtists } from '../../hooks/usePopularArtists';
import './SearchModalPopularArtists.css';

const PREVIEW_LIMIT = 7;
const MORE_PATH = '/music/more/artists';

/**
 * Qidiruv modalidagi “Mashhur artistlar”.
 * Ma’lumot: usePopularArtists (shu API, limit 7).
 * Musiqa sahifasidagi PopularArtists komponenti ishlatilmaydi.
 * “Barchasini ko‘rish” — /music/more/artists, katalogdagi hammasi.
 */
const SearchModalPopularArtists = ({ onNavigateAway }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { allArtists, artistsLoading } = useMusicApi();
  const { items, loading } = usePopularArtists(PREVIEW_LIMIT);

  const artists = useMemo(() => {
    const byId = new Map((allArtists || []).map((artist) => [String(artist.id), artist]));
    const out = [];
    for (const row of items) {
      const artist = byId.get(String(row.artistId));
      if (!artist) continue;
      out.push(artist);
      if (out.length >= PREVIEW_LIMIT) break;
    }
    return out;
  }, [allArtists, items]);

  const waiting = (loading || artistsLoading) && artists.length === 0;

  const goMore = () => {
    onNavigateAway?.();
    navigate(MORE_PATH);
  };

  const openArtist = (artist) => {
    if (artist?.id == null) return;
    onNavigateAway?.();
    navigate(`/music/artist/${artist.id}`);
  };

  if (!waiting && artists.length === 0) return null;

  return (
    <section className="search-modal-artists" aria-busy={waiting || undefined}>
      <div className="search-modal-artists-header">
        <h2 className="search-modal-artists-title">
          {t('music.mashhurArtistlar', 'Mashhur artistlar')}
        </h2>
        <button type="button" className="search-modal-artists-more" onClick={goMore}>
          {t('music.barchasiniKorish', "Barchasini ko'rish")}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M9.3 6.3 14.9 12l-5.6 5.7 1.4 1.4L17.8 12 10.7 4.9z" />
          </svg>
        </button>
      </div>

      <ScrollTouch className="search-modal-artists-list">
        {waiting
          ? Array.from({ length: PREVIEW_LIMIT }, (_, index) => (
              <div
                key={`search-artist-skel-${index}`}
                className="search-modal-artists-item search-modal-artists-item--skeleton"
                aria-hidden="true"
              />
            ))
          : artists.map((artist) => (
              <button
                key={artist.id}
                type="button"
                className="search-modal-artists-item"
                onClick={() => openArtist(artist)}
              >
                <span className="search-modal-artists-avatar">
                  <img
                    src={artist.imgArtist || artist.img || '/img/movie1.jpg'}
                    alt=""
                  />
                </span>
                <span className="search-modal-artists-name">{artist.name}</span>
              </button>
            ))}
      </ScrollTouch>
    </section>
  );
};

export default SearchModalPopularArtists;
