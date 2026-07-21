import React from 'react';
import ShortsVideos from '../components/ShortsVideos/ShortsVideos';
import { useMusicApi } from '../context/MusicApiContext';

const MusicShorts = ({ startIndex = null, onCloseFromHome = null, repostIds = null, repostShortsEntries = null }) => {
  const { musicShortsCatalog } = useMusicApi();

  return (
    <div className="music-shorts">
      <ShortsVideos
        initialShorts={musicShortsCatalog}
        startIndex={startIndex}
        onCloseFromHome={onCloseFromHome}
        variant="music"
        repostIds={repostIds}
        repostShortsEntries={repostShortsEntries}
      />
    </div>
  );
};

export default MusicShorts;
