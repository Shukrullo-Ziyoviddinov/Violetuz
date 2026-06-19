import React, { useState } from 'react';
import ScrollTouch from '../../components/ScrollTouch/ScrollTouch';
import ArtistMusicStoryModal from '../ArtistMusicStoryModal/ArtistMusicStoryModal';
import './ArtistMusicStory.css';

const ArtistMusicStory = ({ stories }) => {
  const [modalStory, setModalStory] = useState(null);

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
