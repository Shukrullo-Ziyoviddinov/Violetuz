import React from 'react';
import FeedMovieCard from './FeedMovieCard';
import FeedMusicCard from './FeedMusicCard';
import FeedVideoCard from './FeedVideoCard';
import './FeedItem.css';

const FeedItem = ({ item }) => {
  if (item.type === 'movie') return <FeedMovieCard item={item} />;
  if (item.type === 'music') return <FeedMusicCard item={item} />;
  return <FeedVideoCard item={item} />;
};

export default FeedItem;
