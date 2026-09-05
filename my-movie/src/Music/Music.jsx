import React, { useMemo } from 'react';
import MusicBanner from './MusicBanner/MusicBanner';
import VideoBanner from '../components/VideoBanner';
import MusicCards from './MusicCards/MusicCards';
import ClipsCards from './ClipsCards/ClipsCards';
import HomeShorts from '../components/HomeShorts/HomeShorts';
import RecommendedArtists from './RecommendedArtists/RecommendedArtists';
import { ActiveClipProvider } from '../components/cartochkaHoverModal/ActiveClipContext';
import { useMusicApi } from '../context/MusicApiContext';
import {
  useHomeMusicCategoryRecommendations,
  musicHomeRecKey,
} from '../hooks/useHomeMusicCategoryRecommendations';
import { wishlistTypeToContentType } from '../api/musicRecommendationsApi';
import './Music.css';

const MUSIC_SECTION_SKELETON_COUNT = 3;
const MUSIC_SKELETON_SECTION = {
  id: 'music-skeleton',
  titleKey: '',
  titleDefault: '',
  wishlistType: 'music',
  initialCount: 10,
};

const Music = () => {
  const {
    getSectionById,
    getClipSectionById,
    getConcertSectionById,
    getClipsByCategory,
    getConcertsByCategory,
    pageContent,
    pageContentLoading,
    sectionsLoading,
    clipSectionsLoading,
    concertSectionsLoading,
  } = useMusicApi();

  const blocks = Array.isArray(pageContent) ? pageContent : [];
  const showMusicSectionSkeletons = pageContentLoading && blocks.length === 0;

  const homeRecRequests = useMemo(() => {
    const requests = [];
    for (const block of blocks) {
      if (block?.type === 'music' && block.sectionId) {
        const section = getSectionById(block.sectionId);
        if (section?.categoryNameMusic) {
          const contentType = wishlistTypeToContentType(
            section.wishlistType || 'music'
          );
          if (contentType) {
            requests.push({
              category: section.categoryNameMusic,
              contentType,
            });
          }
        }
      }
      if (block?.type === 'clips' && block.sectionId) {
        const clipSection = getClipSectionById(block.sectionId);
        if (clipSection?.categoryNameMusic) {
          const contentType = wishlistTypeToContentType(
            clipSection.wishlistType || 'klip'
          );
          if (contentType) {
            requests.push({
              category: clipSection.categoryNameMusic,
              contentType,
            });
          }
          continue;
        }
        const concertSection = getConcertSectionById(block.sectionId);
        if (concertSection?.categoryNameMusic) {
          const contentType = wishlistTypeToContentType(
            concertSection.wishlistType || 'konsert'
          );
          if (contentType) {
            requests.push({
              category: concertSection.categoryNameMusic,
              contentType,
            });
          }
        }
      }
    }
    return requests;
  }, [blocks, getSectionById, getClipSectionById, getConcertSectionById]);

  const personalizedByKey = useHomeMusicCategoryRecommendations(homeRecRequests);

  const resolveSectionItems = (categoryNameMusic, wishlistType, catalogItems) => {
    const contentType = wishlistTypeToContentType(wishlistType);
    const personalized =
      contentType &&
      personalizedByKey[musicHomeRecKey(categoryNameMusic, contentType)];
    return personalized?.length > 0 ? personalized : catalogItems;
  };

  return (
    <ActiveClipProvider>
      <div className="music-section">
        <MusicBanner />
        <div className="music-container">
          {showMusicSectionSkeletons
            ? Array.from({ length: MUSIC_SECTION_SKELETON_COUNT }, (_, index) => (
                <MusicCards
                  key={`music-section-skeleton-${index}`}
                  section={{ ...MUSIC_SKELETON_SECTION, id: `music-skeleton-${index}` }}
                  isLoading
                />
              ))
            : blocks.map((block, idx) => {
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
                  const clipSection = getClipSectionById(block.sectionId);
                  if (clipSection) {
                    const catalog = getClipsByCategory(clipSection.categoryNameMusic);
                    const data = resolveSectionItems(
                      clipSection.categoryNameMusic,
                      clipSection.wishlistType || 'klip',
                      catalog
                    );
                    return (
                      <ClipsCards
                        key={clipSection.id}
                        section={{
                          ...clipSection,
                          data,
                        }}
                      />
                    );
                  }

                  const concertSection = getConcertSectionById(block.sectionId);
                  if (concertSection) {
                    const catalog = getConcertsByCategory(
                      concertSection.categoryNameMusic
                    );
                    const data = resolveSectionItems(
                      concertSection.categoryNameMusic,
                      concertSection.wishlistType || 'konsert',
                      catalog
                    );
                    return (
                      <ClipsCards
                        key={concertSection.id}
                        section={{
                          ...concertSection,
                          data,
                        }}
                      />
                    );
                  }

                  if (clipSectionsLoading || concertSectionsLoading || pageContentLoading) {
                    return (
                      <ClipsCards
                        key={`clips-skeleton-${block.sectionId || idx}`}
                        section={{
                          id: `clips-skeleton-${block.sectionId || idx}`,
                          titleKey: '',
                          titleDefault: '',
                          wishlistType: 'klip',
                          initialCount: 10,
                          data: [],
                        }}
                        isLoading
                      />
                    );
                  }

                  return null;
                }

                if (block.type === 'music') {
                  const section = getSectionById(block.sectionId);
                  if (section) {
                    return (
                      <MusicCards
                        key={section.id}
                        section={section}
                        items={
                          resolveSectionItems(
                            section.categoryNameMusic,
                            section.wishlistType || 'music',
                            null
                          ) || undefined
                        }
                      />
                    );
                  }

                  if (sectionsLoading || pageContentLoading) {
                    return (
                      <MusicCards
                        key={`section-skeleton-${block.sectionId || idx}`}
                        section={{
                          ...MUSIC_SKELETON_SECTION,
                          id: `section-skeleton-${block.sectionId || idx}`,
                        }}
                        isLoading
                      />
                    );
                  }

                  return null;
                }

                return null;
              })}
        </div>
      </div>
    </ActiveClipProvider>
  );
};

export default Music;
