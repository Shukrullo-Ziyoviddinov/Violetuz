import React, { useEffect, useRef, useState } from 'react';
import lottie from 'lottie-web/build/player/lottie_svg';

const ChatLottie = ({ id, className = '', label = '' }) => {
  const hostRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const safeId = /^[0-9]{1,12}$/.test(String(id || '')) ? String(id) : '';

  useEffect(() => {
    const node = hostRef.current;
    if (!node || typeof IntersectionObserver !== 'function') {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    }, { rootMargin: '120px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = hostRef.current;
    if (!node || !visible || !safeId) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const anim = lottie.loadAnimation({
      container: node,
      renderer: 'svg',
      loop: !reduced,
      autoplay: !reduced,
      path: `/animationEmoj/${safeId}.json`,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });
    if (reduced) anim.addEventListener('DOMLoaded', () => anim.goToAndStop(0, true));
    return () => anim.destroy();
  }, [safeId, visible]);

  return <span ref={hostRef} className={`chat-lottie ${className}`.trim()} role="img" aria-label={label || undefined} />;
};

export default ChatLottie;
