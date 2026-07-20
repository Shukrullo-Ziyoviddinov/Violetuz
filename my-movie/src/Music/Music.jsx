import React from 'react';
import MusicBanner from './MusicBanner/MusicBanner';
import VideoBanner from '../components/VideoBanner';
import MusicCards from './MusicCards/MusicCards';
import ClipsCards from './ClipsCards/ClipsCards';
import HomeShorts from '../components/HomeShorts/HomeShorts';
import RecommendedArtists from './RecommendedArtists/RecommendedArtists';
import { ActiveClipProvider } from '../components/cartochkaHoverModal/ActiveClipContext';
import { CLIPS_SECTIONS } from '../dataMusic/clipsSectionsConfig';
import { useMusicApi } from '../context/MusicApiContext';
import './Music.css';

const Music = () => {
  const { getSectionById, pageContent } = useMusicApi();
  const clipsById = Object.fromEntries((CLIPS_SECTIONS || []).map((s) => [s.id, s]));

  return (
    <ActiveClipProvider>
      <div className="music-section">
        <MusicBanner />
        <div className="music-container">
          {(Array.isArray(pageContent) ? pageContent : []).map((block, idx) => {
            if (block.type === 'shorts') {
              return (
                <HomeShorts
                  key={`shorts-${block.variant || idx}`}
                  source={block.source || 'music'}
                  variant={block.variant}
                />
              );
            }

            if (block.type === 'videoBanner') {
              return (
                <VideoBanner
                  key={`video-banner-${idx}`}
                  typeFilter={block.typeFilter || 'music'}
                />
              );
            }

            if (block.type === 'recommendedArtists') {
              return <RecommendedArtists key="recommended-artists" />;
            }

            if (block.type === 'clips') {
              const clipSection = clipsById[block.sectionId];
              if (!clipSection) return null;
              return <ClipsCards key={clipSection.id} section={clipSection} />;
            }

            if (block.type === 'music') {
              const section = getSectionById(block.sectionId);
              if (!section) return null;
              return <MusicCards key={section.id} section={section} />;
            }

            return null;
          })}
        </div>
      </div>
    </ActiveClipProvider>
  );
};

export default Music;
