import React from 'react';
import { useQuery } from '@tanstack/react-query';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import TrillerCard from './TrillerCard';
import { fetchAllTrillers } from '../../api/trillersApi';
import './TrillerSection.css';

const TrillerSection = () => {
  const { data: list = [], isPending } = useQuery({
    queryKey: ['trillers'],
    queryFn: fetchAllTrillers,
  });

  if (!isPending && !list.length) return null;

  return (
    <section className="triller-section">
      <div className="triller-section-container">
        <div className="triller-section-header">
          <h2 className="triller-section-title">Triller</h2>
        </div>
        <div className="triller-section-scroll">
          <HorizontalScroll>
            {(list.length ? list : Array.from({ length: 6 }, (_, i) => ({ id: `sk-${i}`, _skeleton: true }))).map(
              (item) =>
                item._skeleton ? (
                  <div key={item.id} className="triller-card triller-card--skeleton" aria-hidden="true" />
                ) : (
                  <TrillerCard key={item.id} triller={item} />
                )
            )}
          </HorizontalScroll>
        </div>
      </div>
    </section>
  );
};

export default TrillerSection;
