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
import { HOME_CONTENT, MOVIE_SECTIONS_BY_ID } from '../data/moviesSectionsConfig';
import './Home.css';

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="home">
      <Banner />
      <Categories />
      {HOME_CONTENT.map((block, idx) => {
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
        const section = MOVIE_SECTIONS_BY_ID[block.sectionId];
        if (!section) return null;
        const {
          id: sectionType,
          data: filteredMovies,
          titleKey,
          moreTo,
          showHorizontalScroll,
        } = section;
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
