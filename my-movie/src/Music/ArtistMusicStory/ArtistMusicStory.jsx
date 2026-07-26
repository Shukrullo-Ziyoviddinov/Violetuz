import React, { useState } from 'react';
import ScrollTouch from '../../components/ScrollTouch/ScrollTouch';
import SkeletonLoader from '../../components/SkeletonLoader/SkeletonLoader';
import ArtistMusicStoryModal from '../ArtistMusicStoryModal/ArtistMusicStoryModal';
import './ArtistMusicStory.css';

const STORY_SKELETON_COUNT = 6;

const ArtistMusicStory = ({ stories, forceSkeleton = false }) => {
  const [modalStory, setModalStory] = useState(null);

  if (forceSkeleton) {
    return (
      <div
        className="artist-music-story artist-music-story--skeleton"
        aria-busy="true"
        aria-hidden="true"
      >
        <div className="artist-music-story-list">
          {Array.from({ length: STORY_SKELETON_COUNT }, (_, i) => (
            <span
              key={`artist-story-skel-${i}`}
              className="artist-music-story-item artist-music-story-item--skeleton"
            >
              <SkeletonLoader variant="artist-music-story-item" />
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (!stories?.length) return null;

  return (
    <>
      <div className="artist-music-story">
        <ScrollTouch className="artist-music-story-list">
          {stories.map((story) => (
            <button
              key={story.id}
              type="button"
              className="artist-music-story-item"
              onClick={() => setModalStory(story)}
              aria-label={story.title}
            >
              <img
                src={story.img || '/img/movie1.jpg'}
                alt={story.title}
                className="artist-music-story-img"
              />
            </button>
          ))}
        </ScrollTouch>
      </div>
      {modalStory && (
        <ArtistMusicStoryModal
          stories={stories}
          story={modalStory}
          onClose={() => setModalStory(null)}
          onStoryChange={setModalStory}
        />
      )}
    </>
  );
};

export default ArtistMusicStory;
