import React from 'react';
import MusicBanner from './MusicBanner/MusicBanner';
import VideoBanner from '../components/VideoBanner';
import MusicCards from './MusicCards/MusicCards';
import ClipsCards from './ClipsCards/ClipsCards';
import HomeShorts from '../components/HomeShorts/HomeShorts';
import RecommendedArtists from './RecommendedArtists/RecommendedArtists';
import { ActiveClipProvider } from '../components/cartochkaHoverModal/ActiveClipContext';
import { CLIPS_SECTIONS } from '../dataMusic/clipsSectionsConfig';
import { MUSIC_SECTIONS } from '../dataMusic/musicSectionsConfig';
import './Music.css';

const Music = () => {
  const topSections = MUSIC_SECTIONS.filter((s) => s.position === 'top');
  const betweenClipsSections = MUSIC_SECTIONS.filter((s) => s.position === 'between-clips');
  const bottomSections = MUSIC_SECTIONS.filter((s) => s.position === 'bottom');
  const [firstClip, ...restClips] = CLIPS_SECTIONS;
  const visualBeatsSection = CLIPS_SECTIONS.find((s) => s.id === 'visual-beats');
  const sevgiVaIchqSection = CLIPS_SECTIONS.find((s) => s.id === 'sevgi-va-ichq');
  const trendVideosSection = CLIPS_SECTIONS.find((s) => s.id === 'trend-videos');
  const sahnadagiIjodSection = CLIPS_SECTIONS.find((s) => s.id === 'sahnadagi-ijod');
  const liveStagesSection = CLIPS_SECTIONS.find((s) => s.id === 'live-stages');
  const starsStageSection = CLIPS_SECTIONS.find((s) => s.id === 'stars-stage');
  const restClipsWithoutVisualBeats = restClips.filter((s) => s.id !== 'visual-beats' && s.id !== 'sevgi-va-ichq' && s.id !== 'trend-videos' && s.id !== 'sahnadagi-ijod' && s.id !== 'live-stages' && s.id !== 'stars-stage');
  const sevgiIndex = bottomSections.findIndex((s) => s.id === 'sevgi-va-musiqa');
  const bottomBeforeVisualBeats = bottomSections.slice(0, sevgiIndex + 1);
  const bottomAfterVisualBeats = bottomSections.slice(sevgiIndex + 1);
  const musicHubIndex = bottomAfterVisualBeats.findIndex((s) => s.id === 'music-hub');
  const bottomUntilMusicHub = bottomAfterVisualBeats.slice(0, musicHubIndex + 1);
  const bottomAfterSevgiVaIchq = bottomAfterVisualBeats.slice(musicHubIndex + 1);
  const bassMusicIndex = bottomAfterSevgiVaIchq.findIndex((s) => s.id === 'bass-music');
  const bottomUntilBassMusic = bottomAfterSevgiVaIchq.slice(0, bassMusicIndex + 1);
  const bottomAfterTrendVideos = bottomAfterSevgiVaIchq.slice(bassMusicIndex + 1);

  return (
    <ActiveClipProvider>
    <div className="music-section">
      <MusicBanner />
      <div className="music-container">
        {topSections.map((section) => (
          <MusicCards key={section.id} section={section} />
        ))}
        <HomeShorts source="music" variant="primary" />
        {firstClip && <ClipsCards key={firstClip.id} section={firstClip} />}
        {betweenClipsSections.map((section) => (
          <MusicCards key={section.id} section={section} />
        ))}
        {restClipsWithoutVisualBeats.map((section) => (
          <ClipsCards key={section.id} section={section} />
        ))}
        {bottomBeforeVisualBeats.slice(0, 1).map((section) => (
          <MusicCards key={section.id} section={section} />
        ))}
        {liveStagesSection && <ClipsCards key={liveStagesSection.id} section={liveStagesSection} />}
        {bottomBeforeVisualBeats.slice(1).map((section) => (
          <MusicCards key={section.id} section={section} />
        ))}
        <VideoBanner typeFilter="music" />
        <RecommendedArtists />
        {visualBeatsSection && <ClipsCards key={visualBeatsSection.id} section={visualBeatsSection} />}
        {bottomUntilMusicHub.map((section) => (
          <MusicCards key={section.id} section={section} />
        ))}
        {sevgiVaIchqSection && <ClipsCards key={sevgiVaIchqSection.id} section={sevgiVaIchqSection} />}
        {bottomUntilBassMusic.slice(0, 1).map((section) => (
          <MusicCards key={section.id} section={section} />
        ))}
        {starsStageSection && <ClipsCards key={starsStageSection.id} section={starsStageSection} />}
        <HomeShorts source="music" variant="tertiary" />
        {bottomUntilBassMusic.slice(1).map((section) => (
          <MusicCards key={section.id} section={section} />
        ))}
        {trendVideosSection && <ClipsCards key={trendVideosSection.id} section={trendVideosSection} />}
        {bottomAfterTrendVideos.map((section) => (
          <MusicCards key={section.id} section={section} />
        ))}
        <HomeShorts source="music" variant="secondary" />
        {sahnadagiIjodSection && <ClipsCards key={sahnadagiIjodSection.id} section={sahnadagiIjodSection} />}
      </div>
    </div>
    </ActiveClipProvider>
  );
};

export default Music;
