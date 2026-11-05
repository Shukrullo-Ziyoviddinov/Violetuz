import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTrailerFeed } from './TrailerFeedContext';
import ShowMoreButton from '../components/ShowMoreButton/ShowMoreButton';
import TrailerHomeCard from './TrailerHomeCard';
import HorizontalScroll from '../components/HorizontalScroll/HorizontalScroll';
import './HomeTrailerSection.css';

export default function HomeTrailerSection({ blockIndex = 0 }) {
  const { t } = useTranslation();
  const { items, ready } = useTrailerFeed();
  const cards = items.slice(blockIndex * 10, (blockIndex + 1) * 10);
  if (ready && !cards.length) return null;
  return <section className="home-trailer-section" aria-label={t('homeTrailers', { defaultValue: 'Treylerlar' })} data-trailer-block={blockIndex + 1}>
    <div className="home-trailer-section-header">
      <h2>{t('homeTrailers', { defaultValue: 'Treylerlar' })}</h2>
      {ready && <ShowMoreButton to="/recommended/trailers" />}
    </div>
    <div className="home-trailer-section-row" aria-busy={!ready}>
      <HorizontalScroll>
      {ready ? cards.map((item) => <TrailerHomeCard key={item.key} item={item} />)
        : Array.from({ length: 5 }, (_, index) => <div key={index} className="home-trailer-placeholder" />)}
      </HorizontalScroll>
    </div>
  </section>;
}
