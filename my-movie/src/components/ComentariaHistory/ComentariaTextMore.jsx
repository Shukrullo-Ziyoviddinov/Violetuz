import React, { useState, Fragment } from 'react';
import './ComentariaTextMore.css';

const ChevronDownIcon = () => (
  <svg className="comentaria-text-more-btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg className="comentaria-text-more-btn-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M18 15l-6-6-6 6" />
  </svg>
);

/**
 * Bir nechta `.comentaria-history-comment-block` bo‘lganda dastlab faqat birinchisi ko‘rinadi;
 * qolganlari yashirin — «Ko'proq sharhlar» / «Kamroq sharhlar».
 */
const ComentariaTextMore = ({ lang, items, children }) => {
  const [expanded, setExpanded] = useState(false);
  const hasMore = items.length > 1;
  const uz = lang !== 'ru';

  const labelMore = uz ? "Ko'proq sharhlar" : 'Больше комментариев';
  const labelLess = uz ? 'Kamroq sharhlar' : 'Меньше комментариев';

  const onToggle = (e, next) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(next);
  };

  return (
    <>
      <div className="comentaria-history-comment-list">
        {items.map((item, index) => {
          const collapsed = hasMore && index > 0 && !expanded;
          return (
            <Fragment key={item.key ?? index}>{children(item, { collapsed })}</Fragment>
          );
        })}
      </div>
      {hasMore ? (
        !expanded ? (
          <button
            type="button"
            className="comentaria-text-more-btn comentaria-text-more-btn--more"
            onClick={(e) => onToggle(e, true)}
            aria-expanded={false}
          >
            <span className="comentaria-text-more-btn-label">{labelMore}</span>
            <ChevronDownIcon />
          </button>
        ) : (
          <button
            type="button"
            className="comentaria-text-more-btn comentaria-text-more-btn--less"
            onClick={(e) => onToggle(e, false)}
            aria-expanded
          >
            <span className="comentaria-text-more-btn-label">{labelLess}</span>
            <ChevronUpIcon />
          </button>
        )
      ) : null}
    </>
  );
};

export default ComentariaTextMore;
