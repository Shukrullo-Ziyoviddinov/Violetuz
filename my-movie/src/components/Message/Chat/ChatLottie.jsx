import React, { useEffect, useRef, useState } from 'react';
import lottie from 'lottie-web/build/player/lottie_svg';
import SkeletonLoader from '../../SkeletonLoader/SkeletonLoader';

const ChatLottie = ({ id, className = '', label = '', root = null }) => {
  const hostRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const safeId = /^[0-9]{1,12}$/.test(String(id || '')) ? String(id) : '';

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver !== 'function') {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    }, { root: root || null, rootMargin: '48px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [root]);

  useEffect(() => {
    const node = hostRef.current;
    if (!node || !visible || !safeId) return undefined;
    let gone = false;
    setReady(false);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const anim = lottie.loadAnimation({
      container: node,
      renderer: 'svg',
      loop: !reduced,
      autoplay: !reduced,
      path: `/animationEmoj/${safeId}.json`,
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    });
    const mark = () => {
      if (!gone) setReady(true);
    };
    anim.addEventListener('DOMLoaded', mark);
    anim.addEventListener('data_failed', mark);
    if (reduced) anim.addEventListener('DOMLoaded', () => anim.goToAndStop(0, true));
    return () => {
      gone = true;
      anim.destroy();
      setReady(false);
    };
  }, [safeId, visible]);

  return (
    <span className={`chat-lottie ${className}`.trim()} role="img" aria-label={label || undefined}>
      {visible && !ready ? <SkeletonLoader variant="block" className="chat-lottie-skeleton" /> : null}
      <span ref={hostRef} className="chat-lottie-host" />
    </span>
  );
};

export default ChatLottie;
