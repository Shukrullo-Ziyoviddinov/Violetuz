import React from 'react';
import ShortsVideos from '../components/ShortsVideos/ShortsVideos';
import { musicShorts } from '../dataMusic/musicShorts';

const MusicShorts = ({ startIndex = null, onCloseFromHome = null, repostIds = null, repostShortsEntries = null }) => {
  return (
    <div className="music-shorts">
      <ShortsVideos
        initialShorts={musicShorts}
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
