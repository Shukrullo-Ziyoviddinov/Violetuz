import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export const FILM_BUTTON_SELECTOR = '.video-detail-actions .clip-movie-film-btn';

const FLIGHT_MS = 600;
const FADE_MS = 350;
const PULSE_MS = 1800;

const prefersReducedMotion = () =>
  typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isInViewport = (el) => {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return (
    rect.width > 0
    && rect.height > 0
    && rect.bottom > 0
    && rect.right > 0
    && rect.top < window.innerHeight
    && rect.left < window.innerWidth
  );
};

const pulseFilmButton = (button) => {
  if (!button) return () => {};
  button.classList.add('is-pulse');
  const timer = window.setTimeout(() => {
    button.classList.remove('is-pulse');
  }, PULSE_MS);
  return () => {
    window.clearTimeout(timer);
    button.classList.remove('is-pulse');
  };
};

export const useFilmFlight = ({ clipId, cardRef, flightRef }) => {
  const [hideCard, setHideCard] = useState(false);
  const [gone, setGone] = useState(false);
  const [flight, setFlight] = useState(null);
  const flyingRef = useRef(false);
  const doneRef = useRef(false);
  const pulseClearRef = useRef(() => {});
  const animRef = useRef(null);
  const fadeAnimRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (animRef.current) {
      animRef.current.cancel();
      animRef.current = null;
    }
    if (fadeAnimRef.current) {
      fadeAnimRef.current.cancel();
      fadeAnimRef.current = null;
    }
    pulseClearRef.current();
    pulseClearRef.current = () => {};
  }, []);

  const finish = useCallback(() => {
    doneRef.current = true;
    flyingRef.current = false;
    setFlight(null);
    setHideCard(true);
    setGone(true);
  }, []);

  const cancelFlight = useCallback(() => {
    clearTimers();
    doneRef.current = true;
    flyingRef.current = false;
    setFlight(null);
    setHideCard(true);
    setGone(true);
  }, [clearTimers]);

  const startFlight = useCallback(() => {
    if (doneRef.current || flyingRef.current) return;
    flyingRef.current = true;

    const card = cardRef.current;
    const button = document.querySelector(FILM_BUTTON_SELECTOR);
    const reduced = prefersReducedMotion();

    const fadeAndPulse = () => {
      if (!card) {
        pulseClearRef.current = pulseFilmButton(button);
        finish();
        return;
      }
      card.style.willChange = 'opacity';
      const fade = card.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: FADE_MS, easing: 'ease-out', fill: 'forwards' }
      );
      fadeAnimRef.current = fade;
      fade.onfinish = () => {
        card.style.willChange = '';
        pulseClearRef.current = pulseFilmButton(button);
        finish();
      };
    };

    if (reduced || !card || !button || !isInViewport(button)) {
      fadeAndPulse();
      return;
    }

    const cardRect = card.getBoundingClientRect();
    const btnRect = button.getBoundingClientRect();
    const dx = btnRect.left + btnRect.width / 2 - (cardRect.left + cardRect.width / 2);
    const dy = btnRect.top + btnRect.height / 2 - (cardRect.top + cardRect.height / 2);

    setHideCard(true);
    setFlight({
      left: cardRect.left,
      top: cardRect.top,
      width: cardRect.width,
      height: cardRect.height,
      dx,
      dy,
    });
  }, [cardRef, finish]);

  useEffect(() => {
    doneRef.current = false;
    flyingRef.current = false;
    setHideCard(false);
    setGone(false);
    setFlight(null);
    clearTimers();
  }, [clipId, clearTimers]);

  useLayoutEffect(() => {
    if (!flight) return undefined;
    const node = flightRef.current;
    const button = document.querySelector(FILM_BUTTON_SELECTOR);
    if (!node) return undefined;

    node.style.willChange = 'transform, opacity';
    const { dx, dy } = flight;
    const anim = node.animate(
      [
        { transform: 'translate(0px, 0px) scale(1)', opacity: 1, offset: 0 },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.2}px) scale(0.62)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx * 0.85}px, ${dy * 0.85}px) scale(0.35)`, opacity: 1, offset: 0.7 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.25)`, opacity: 0, offset: 1 },
      ],
      {
        duration: FLIGHT_MS,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards',
      }
    );
    animRef.current = anim;
    anim.onfinish = () => {
      node.style.willChange = '';
      pulseClearRef.current = pulseFilmButton(button);
      finish();
    };
    return () => {
      anim.cancel();
      node.style.willChange = '';
    };
  }, [flight, flightRef, finish]);

  useEffect(() => () => {
    clearTimers();
  }, [clearTimers]);

  return {
    hideCard,
    gone,
    flight,
    startFlight,
    cancelFlight,
  };
};
