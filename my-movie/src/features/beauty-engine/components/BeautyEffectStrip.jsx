import React, { useEffect, useRef } from 'react';
import styles from './BeautyEffectStrip.module.css';

const BeautyEffectStrip = ({
  effects = [],
  value = '',
  onChange,
  disabled = false,
  locked = false,
  ariaLabel = 'Effektlar',
}) => {
  const items = Array.isArray(effects) ? effects : [];
  const scrollerRef = useRef(null);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!locked || !node) return undefined;
    const left = node.scrollLeft;
    const hold = () => {
      if (node.scrollLeft !== left) node.scrollLeft = left;
    };
    const block = (event) => event.preventDefault();
    node.addEventListener('scroll', hold);
    node.addEventListener('touchmove', block, { passive: false });
    node.addEventListener('wheel', block, { passive: false });
    return () => {
      node.removeEventListener('scroll', hold);
      node.removeEventListener('touchmove', block);
      node.removeEventListener('wheel', block);
    };
  }, [locked]);

  return (
    <div
      ref={scrollerRef}
      className={locked ? `${styles.strip} ${styles.stripLocked}` : styles.strip}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {items.map((effect) => {
        const selected = effect.id === value;
        return (
          <button
            key={effect.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={selected ? styles.itemOn : styles.item}
            disabled={disabled}
            onClick={() => onChange?.(effect.id)}
          >
            <span
              className={styles.disc}
              style={effect.swatch ? { background: effect.swatch } : undefined}
            />
            <span className={styles.name}>{effect.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BeautyEffectStrip;
