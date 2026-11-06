import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTrailerFeed } from './TrailerFeedContext';
import ShowMoreButton from '../components/ShowMoreButton/ShowMoreButton';
import TrailerHomeCard, { TrailerHomeCardSkeleton } from './TrailerHomeCard';
import HorizontalScroll from '../components/HorizontalScroll/HorizontalScroll';
import './HomeTrailerSection.css';

const BLOCK_TITLES = [
  'Siz uchun treylerlar',
  'Tomosha qilishga arziydi',
  'Yana nimalarni ko‘ramiz?',
  'Yangi taassurotlar',
];

export default function HomeTrailerSection({ blockIndex = 0 }) {
  const { t } = useTranslation();
  const { items, ready } = useTrailerFeed();
  const cards = items.slice(blockIndex * 10, (blockIndex + 1) * 10);
  const title = t(`trailerHomeBlocks.block${blockIndex + 1}`, { defaultValue: BLOCK_TITLES[blockIndex] || BLOCK_TITLES[0] });
  if (ready && !cards.length) return null;
  return <section className="home-trailer-section" aria-label={title} data-trailer-block={blockIndex + 1}>
    <div className="home-trailer-section-container">
    <div className="home-trailer-section-header">
      <h2>{title}</h2>
      {ready && <ShowMoreButton to="/recommended/trailers" />}
    </div>
    <div className="home-trailer-section-row" aria-busy={!ready}>
      <HorizontalScroll>
      {ready ? cards.map((item) => <TrailerHomeCard key={item.key} item={item} />)
        : Array.from({ length: 10 }, (_, index) => <TrailerHomeCardSkeleton key={index} />)}
      </HorizontalScroll>
    </div>
    </div>
  </section>;
}
