import React, { useRef, useState } from 'react';

const TRIGGER = 72;
const MAX = 96;
const RING = 2 * Math.PI * 15;

const replyIcon = (
  <svg className="chat-reply-cue-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M9 10 4.5 14.5 9 19" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.8 14.5H14a5.5 5.5 0 0 0 5.5-5.5V6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChatReplySwipe = ({ mine, onReply, children }) => {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef(null);
  const lockedRef = useRef('');
  const dxRef = useRef(0);
  const armedRef = useRef(false);

  const progress = Math.min(1, Math.abs(dx) / TRIGGER);

  const finish = (event, commit) => {
    if (!startRef.current || event.pointerId !== startRef.current.id) return;
    const filled = Math.abs(dxRef.current) >= TRIGGER;
    startRef.current = null;
    lockedRef.current = '';
    dxRef.current = 0;
    armedRef.current = false;
    setDragging(false);
    setDx(0);
    if (commit && filled) onReply?.();
  };

  const onPointerDown = (event) => {
    if (event.button != null && event.button !== 0) return;
    startRef.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    lockedRef.current = '';
    dxRef.current = 0;
    armedRef.current = false;
  };

  const onPointerMove = (event) => {
    if (!startRef.current || event.pointerId !== startRef.current.id) return;
    const rawX = event.clientX - startRef.current.x;
    const rawY = event.clientY - startRef.current.y;
    if (!lockedRef.current) {
      if (Math.abs(rawX) < 8 && Math.abs(rawY) < 8) return;
      lockedRef.current = Math.abs(rawX) > Math.abs(rawY) ? 'x' : 'y';
      if (lockedRef.current === 'y') {
        startRef.current = null;
        return;
      }
      setDragging(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }
    if (lockedRef.current !== 'x') return;
    const directed = mine ? Math.min(0, rawX) : Math.max(0, rawX);
    const next = Math.max(-MAX, Math.min(MAX, directed));
    dxRef.current = next;
    setDx(next);
    const filled = Math.abs(next) >= TRIGGER;
    if (filled && !armedRef.current) {
      armedRef.current = true;
      navigator.vibrate?.(18);
    } else if (!filled) {
      armedRef.current = false;
    }
  };

  return (
    <div
      className={`chat-swipe${mine ? ' is-mine' : ''}${dragging ? ' is-dragging' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => finish(event, true)}
      onPointerCancel={(event) => finish(event, false)}
    >
      <span className="chat-reply-cue" style={{ opacity: progress }} aria-hidden="true">
        <svg className="chat-reply-ring" viewBox="0 0 36 36">
          <circle className="chat-reply-ring-track" cx="18" cy="18" r="15" />
          <circle
            className="chat-reply-ring-fill"
            cx="18"
            cy="18"
            r="15"
            strokeDasharray={RING}
            strokeDashoffset={RING * (1 - progress)}
          />
        </svg>
        {replyIcon}
      </span>
      <div className={`chat-swipe-shift${dragging ? '' : ' is-back'}`} style={{ transform: `translateX(${dx}px)` }}>
        {children}
      </div>
    </div>
  );
};

export default ChatReplySwipe;
