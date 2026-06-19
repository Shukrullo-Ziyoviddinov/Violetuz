import React, { useRef, useEffect, useState } from 'react';
import { useActiveClip } from './ActiveClipContext';
import './CartochkaMobileAutoPlay.css';

const MOBILE_BREAKPOINT = 768;
const VISIBLE_DELAY_MS = 1000;

/**
 * Mobil: kartochka ko'rinib 1 soniya tuxtaganda video ichkarida avto-ijro.
 * Desktop: faqat children render (hover modal alohida).
 */
const CartochkaMobileAutoPlay = ({
  item,
  children,
  onCardClick,
}) => {
  const cardRef = useRef(null);
  const timerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const { activeId, setActiveId } = useActiveClip();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!item?.video || !isMobile) return;

    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;

        if (entry.isIntersecting) {
          timerRef.current = setTimeout(() => {
            setActiveId(item.id);
            timerRef.current = null;
          }, VISIBLE_DELAY_MS);
        } else {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          setActiveId((prev) => (prev === item.id ? null : prev));
        }
      },
      { threshold: 0.85, root: null, rootMargin: '0px' }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item?.id, item?.video, isMobile, setActiveId]);

  const isActive = activeId === item.id;
  const showVideo = isMobile && isActive && item?.video;

  if (!item?.video) return <>{children}</>;
  if (!isMobile) return <>{children}</>;

  return (
    <div ref={cardRef} className="cartochka-mobile-autoplay-wrapper">
      {showVideo ? (
        <div
          className="cartochka-mobile-autoplay-video"
          onClick={() => onCardClick?.(item.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onCardClick?.(item.id)}
          aria-label={item.title}
        >
          <video
            src={item.video}
            poster={item.img}
            autoPlay
            muted
            loop
            playsInline
            className="cartochka-mobile-autoplay-video-el"
          />
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export default CartochkaMobileAutoPlay;
