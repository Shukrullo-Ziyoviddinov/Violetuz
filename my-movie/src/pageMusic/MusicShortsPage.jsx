import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { parseRepostShortsParam } from '../components/Repost/repostTypes';
import MusicShorts from '../Music/MusicShorts';
import './MusicShortsPage.css';

const MusicShortsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const startIndex = searchParams.get('startIndex');
  const startIndexNum = startIndex != null ? parseInt(startIndex, 10) : null;
  const repostIdsRaw = searchParams.get('repostIds');
  const repostIds = useMemo(() => {
    if (!repostIdsRaw || typeof repostIdsRaw !== 'string' || !repostIdsRaw.trim()) return null;
    const parts = repostIdsRaw.split(',').map((s) => s.trim()).filter(Boolean);
    return parts.length ? parts : null;
  }, [repostIdsRaw]);
  const repostShortsRaw = searchParams.get('repostShorts');
  const repostShortsEntries = useMemo(() => parseRepostShortsParam(repostShortsRaw), [repostShortsRaw]);

  const fromHomeLink =
    (startIndex != null && !isNaN(startIndexNum)) ||
    (repostIds != null && repostIds.length > 0) ||
    (repostShortsEntries != null && repostShortsEntries.length > 0);

  const handleCloseFromHome = () => {
    if (fromHomeLink) navigate(-1);
  };

  return (
    <div className="music-shorts-page">
      <MusicShorts
        startIndex={isNaN(startIndexNum) ? null : startIndexNum}
        onCloseFromHome={fromHomeLink ? handleCloseFromHome : undefined}
        repostIds={repostIds}
        repostShortsEntries={repostShortsEntries}
      />
    </div>
  );
};

export default MusicShortsPage;
