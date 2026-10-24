import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useMusicApi } from '../context/MusicApiContext';

/** Eski /music/shorts havolalari bitta shorts sahifasiga tushadi. */
const MusicShortsPage = () => {
  const [searchParams] = useSearchParams();
  const { musicShortsCatalog, musicShortsLoading } = useMusicApi();
  const startIndexRaw = searchParams.get('startIndex');
  const startIndex = startIndexRaw != null ? parseInt(startIndexRaw, 10) : null;
  const hasRepost = searchParams.has('repostIds') || searchParams.has('repostShorts');

  if (hasRepost) {
    return <Navigate to={`/shorts?${searchParams.toString()}`} replace />;
  }

  const needsIndex = startIndex != null && !Number.isNaN(startIndex);
  if (needsIndex && musicShortsLoading && !musicShortsCatalog?.length) {
    return null;
  }

  const params = new URLSearchParams();
  const explicitId = searchParams.get('shortId') || searchParams.get('id');
  const indexedId = needsIndex ? musicShortsCatalog?.[startIndex]?.id : null;
  const shortId = explicitId || indexedId;
  if (shortId != null && shortId !== '') params.set('shortId', String(shortId));
  const qs = params.toString();
  return <Navigate to={qs ? `/shorts?${qs}` : '/shorts'} replace />;
};

export default MusicShortsPage;
