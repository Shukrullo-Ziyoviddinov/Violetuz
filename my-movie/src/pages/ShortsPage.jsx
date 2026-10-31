import React, { useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { parseRepostShortsParam } from '../components/Repost/repostTypes';
import ShortsVideos from '../components/ShortsVideos/ShortsVideos';
import './ShortsPage.css';

const ShortsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const startIndex = searchParams.get('startIndex');
  const startIndexNum = startIndex != null ? parseInt(startIndex, 10) : null;
  const shortId = searchParams.get('shortId') || searchParams.get('id');
  const artistSeq = searchParams.get('artistSeq');
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
    (shortId != null && String(shortId) !== '') ||
    (repostIds != null && repostIds.length > 0) ||
    (repostShortsEntries != null && repostShortsEntries.length > 0);

  const handleCloseFromHome = () => {
    if (!fromHomeLink) return;
    const returnTo = location.state?.shortsReturnTo;
    if (typeof returnTo === 'string' && returnTo) {
      navigate(returnTo, { replace: true });
      return;
    }
    navigate(-1);
  };

  return (
    <div className="shorts-page">
      <ShortsVideos
        startIndex={isNaN(startIndexNum) ? null : startIndexNum}
        shortId={shortId}
        artistSeq={artistSeq}
        onCloseFromHome={fromHomeLink ? handleCloseFromHome : undefined}
        repostIds={repostIds}
        repostShortsEntries={repostShortsEntries}
      />
    </div>
  );
};

export default ShortsPage;
