import React, { useMemo } from 'react';
import MusicCards from '../MusicCards/MusicCards';
import { useMusicApi } from '../../context/MusicApiContext';
import { usePopularAlbums } from '../../hooks/usePopularAlbums';

const POPULAR_ALBUMS_SECTION = {
  id: 'popular-albums',
  titleKey: 'music.mashhurAlbomlar',
  titleDefault: 'Mashhur Albomlar',
  wishlistType: 'album',
  detailPathType: 'album',
  initialCount: 20,
};

/**
 * Mashhur albomlar — thin product wrapper.
 * Data: usePopularAlbums (ListenEvent album, 30 kun, max 20).
 * UI: MusicCards — oddiy albom kartochka, rank PNG yo‘q.
 */
const PopularAlbums = () => {
  const { items, loading } = usePopularAlbums();
  const { allAlbums, albumsLoading } = useMusicApi();

  const displayAlbums = useMemo(() => {
    const byId = new Map((allAlbums || []).map((album) => [String(album.id), album]));
    const out = [];
    for (const row of items) {
      const album = byId.get(String(row.contentId));
      if (!album) continue;
      out.push(album);
    }
    return out;
  }, [allAlbums, items]);

  const waiting =
    loading || (items.length > 0 && albumsLoading && displayAlbums.length === 0);

  if (!waiting && displayAlbums.length === 0) return null;

  return (
    <MusicCards
      section={{
        ...POPULAR_ALBUMS_SECTION,
        initialCount: displayAlbums.length > 0 ? displayAlbums.length : 20,
      }}
      items={waiting ? [] : displayAlbums}
      isLoading={waiting}
    />
  );
};

export default PopularAlbums;
