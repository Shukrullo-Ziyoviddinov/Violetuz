import React from 'react';
import HomeTrailerSection from './HomeTrailerSection';

export default function HomeTrailerRows({ children }) {
  const rows = React.Children.toArray(children);
  const output = [];
  // First block follows ForYouMovies; the other three span the remaining Home rows.
  for (let slot = 0; slot <= rows.length; slot++) {
    for (let block = 0; block < 4; block++) {
      if (Math.round(rows.length * block / 3) === slot) output.push(<HomeTrailerSection key={`trailers-${block}`} blockIndex={block} />);
    }
    if (slot < rows.length) output.push(rows[slot]);
  }
  return <>{output}</>;
}
