import React from 'react';
import HorizontalScroll from '../HorizontalScroll/HorizontalScroll';
import TrillerCard from './TrillerCard';
import trillers from '../../data/triller.json';
import './TrillerSection.css';

const TrillerSection = () => {
  const list = Array.isArray(trillers) ? trillers : [];
  if (!list.length) return null;

  return (
    <section className="triller-section">
      <div className="triller-section-container">
        <div className="triller-section-header">
          <h2 className="triller-section-title">Triller</h2>
        </div>
        <div className="triller-section-scroll">
          <HorizontalScroll>
            {list.map((item) => (
              <TrillerCard key={item.id} triller={item} />
            ))}
          </HorizontalScroll>
        </div>
      </div>
    </section>
  );
};

export default TrillerSection;
