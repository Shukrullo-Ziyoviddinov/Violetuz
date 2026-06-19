import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ScrollTouch from '../ScrollTouch/ScrollTouch';
import ImgModal from '../ImgModal/ImgModal';
import './MoreModal.css';

const MoreModal = ({ isOpen, onClose, text, bioImg, title = '' }) => {
  const bioImgList = Array.isArray(bioImg) ? bioImg : (bioImg ? [bioImg] : []);
  const [isExiting, setIsExiting] = useState(false);
  const [imgModalOpen, setImgModalOpen] = useState(false);
  const [imgModalIndex, setImgModalIndex] = useState(0);
  const [slideReady, setSlideReady] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsExiting(false);
    setSlideReady(false);
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    const t = setTimeout(() => setSlideReady(true), 20);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 500;

  const handleClose = () => {
    if (isMobile) {
      setIsExiting(true);
      setTimeout(() => onClose(), 320);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const modalContent = (
    <div className="more-modal" onClick={(e) => e.stopPropagation()}>
        <div className="more-modal-header">
          {title && <h3 className="more-modal-title">{title}</h3>}
          <button
            type="button"
            className="more-modal-close"
            onClick={handleClose}
            aria-label="Yopish"
          >
          ×
          </button>
        </div>
        <div className="more-modal-body">
          <p className="more-modal-text">{text}</p>
          {bioImgList.length > 0 && (
            <ScrollTouch className="more-modal-bioimg-row">
              {bioImgList.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="more-modal-bioimg"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setImgModalIndex(i); setImgModalOpen(true); }}
                  onKeyDown={(e) => e.key === 'Enter' && (setImgModalIndex(i), setImgModalOpen(true))}
                />
              ))}
            </ScrollTouch>
          )}
        </div>
    </div>
  );

  return (
    <div
      className={`more-modal-overlay${isExiting ? ' more-modal-overlay--closing' : ''}${isMobile ? ' more-modal-overlay--mobile' : ''}`}
      onClick={handleOverlayClick}
    >
      {isMobile ? (
        <div
          className={`more-modal-panel${slideReady && !isExiting ? ' more-modal-panel--open' : ''}${isExiting ? ' more-modal-panel--closing' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {modalContent}
        </div>
      ) : (
        modalContent
      )}
      {createPortal(
        <ImgModal
          isOpen={imgModalOpen}
          onClose={() => setImgModalOpen(false)}
          images={bioImgList}
          currentIndex={imgModalIndex}
          onIndexChange={setImgModalIndex}
        />,
        document.body
      )}
    </div>
  );
};

export default MoreModal;
