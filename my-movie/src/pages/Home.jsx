import React from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LIMIT } from '../components/ShowMoreButton/ShowMoreButton';
import Banner from '../components/Banner/Banner';
import VideoBanner from '../components/VideoBanner';
import HomeShorts from '../components/HomeShorts/HomeShorts';
import Categories from '../components/Categories';
import Movies from '../components/Movies/Movies';
import TopRatedContent from '../components/TopRatedContent/TopRatedContent';
import RecommendedActors from '../components/RecommendedActors/RecommendedActors';
import { useMoviesApi } from '../context/MoviesApiContext';
import './Home.css';

const HOME_MOVIE_SKELETON_COUNT = 3;

const Home = () => {
  const { t } = useTranslation();
  const {
    getMoviesByCategory,
    getSectionById,
    homeContent,
    moviesLoading,
  } = useMoviesApi();

  const blocks = Array.isArray(homeContent) ? homeContent : [];
  const showHomeMovieSkeletons = moviesLoading && blocks.length === 0;

  return (
    <div className="home">
      <Banner />
      <Categories />
      {showHomeMovieSkeletons
        ? Array.from({ length: HOME_MOVIE_SKELETON_COUNT }, (_, index) => (
            <Movies
              key={`home-movies-skeleton-${index}`}
              sectionType="recommended"
              filteredMovies={[]}
              limit={DEFAULT_LIMIT}
              showHorizontalScroll
              isLoading
            />
          ))
        : blocks.map((block, idx) => {
            if (block.type === 'shorts') {
              return (
                <HomeShorts
                  key={`shorts-${block.variant || idx}`}
                  variant={block.variant}
                />
              );
            }
            if (block.type === 'topRated') {
              return (
                <TopRatedContent
                  key="topRated"
                  limit={DEFAULT_LIMIT}
                  showHorizontalScroll
                  moreTo="/category/topRated"
                />
              );
            }
            if (block.type === 'videoBanner') {
              return <VideoBanner key="videoBanner" typeFilter="movie" />;
            }
            if (block.type === 'recommendedActors') {
              return <RecommendedActors key="recommendedActors" />;
            }
            const section = getSectionById(block.sectionId);
            if (!section) {
              if (moviesLoading) {
                return (
                  <Movies
                    key={`section-skeleton-${block.sectionId || idx}`}
                    sectionType={block.sectionId || 'recommended'}
                    filteredMovies={[]}
                    limit={DEFAULT_LIMIT}
                    showHorizontalScroll
                    isLoading
                  />
                );
              }
              return null;
            }
            const {
              id: sectionType,
              categoryName,
              titleKey,
              moreTo,
              showHorizontalScroll,
            } = section;
            const filteredMovies = getMoviesByCategory(categoryName);
            return (
              <Movies
                key={sectionType}
                sectionType={sectionType}
                filteredMovies={filteredMovies}
                limit={DEFAULT_LIMIT}
                showHorizontalScroll={!!showHorizontalScroll}
                headerTitle={t(titleKey)}
                moreTo={moreTo}
              />
            );
          })}
    </div>
  );
};

export default Home;
