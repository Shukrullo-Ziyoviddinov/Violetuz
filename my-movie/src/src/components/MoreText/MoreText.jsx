import React, { useState, useRef, useLayoutEffect } from 'react';
import MoreModal from '../MoreModal/MoreModal';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import './MoreText.css';

const measureOverflow = (el) => {
  if (!el) return false;
  return el.scrollHeight > el.clientHeight + 1;
};

const MoreText = ({ text, bioImg, lineClamp = 6, moreLabel = 'Yana', modalTitle = '', className = '' }) => {
  const bioImgList = Array.isArray(bioImg) ? bioImg : (bioImg ? [bioImg] : []);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(null);
  const contentRef = useRef(null);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const update = () => {
      setHasOverflow(measureOverflow(el));
    };

    update();
    requestAnimationFrame(update);

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [text, lineClamp]);

  if (!text || typeof text !== 'string') return null;

  if (hasOverflow === false) {
    return (
      <div className={`more-text ${className}`}>
        <p>{text}</p>
        {bioImgList.length > 0 && (
          <ScrollTouch className="more-text-bioimg-row">
            {bioImgList.map((src, i) => (
              <img key={i} src={src} alt="" className="more-text-bioimg" />
            ))}
          </ScrollTouch>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={`more-text ${className}`}>
        <span
          ref={contentRef}
          className="more-text-content more-text-content--collapsed"
          style={{ '--line-clamp': String(lineClamp) }}
        >
          {text}
        </span>
        {hasOverflow !== false && (
          <>
            {' '}
            <button
              type="button"
              className="more-text-trigger"
              onClick={() => setModalOpen(true)}
              aria-haspopup="dialog"
            >
              {moreLabel}
            </button>
          </>
        )}
        {bioImgList.length > 0 && (
          <ScrollTouch className="more-text-bioimg-row">
            {bioImgList.map((src, i) => (
              <img key={i} src={src} alt="" className="more-text-bioimg" />
            ))}
          </ScrollTouch>
        )}
      </div>
      <MoreModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        text={text}
        bioImg={bioImgList}
        title={modalTitle}
      />
    </>
  );
};

export default MoreText;
