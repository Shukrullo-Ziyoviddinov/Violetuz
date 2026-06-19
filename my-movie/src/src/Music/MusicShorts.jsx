import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ShortsVideos from '../components/ShortsVideos/ShortsVideos';
import { musicShorts } from '../dataMusic/musicShorts';

const MusicShorts = ({ startIndex = null, onCloseFromHome = null }) => {
  return (
    <div className="music-shorts">
      <ShortsVideos
        initialShorts={musicShorts}
        startIndex={startIndex}
        onCloseFromHome={onCloseFromHome}
        variant="music"
      />
    </div>
  );
};

export default MusicShorts;
