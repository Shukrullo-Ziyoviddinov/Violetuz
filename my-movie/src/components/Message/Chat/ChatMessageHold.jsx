import React, { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { emojiFromId, emojiOnlyCount } from './chatEmojis';
import ChatMessageBlock from './ChatMessageBlock';
import { shatterElement, SHATTER_MS } from './chatShatter';

const QUICK = ['1f44d', '2764', '1f602', '1f62e', '1f37f', '1f525'];
const MOVE_MS = 340;
const PANEL_MS = 170;

const MenuIcon = ({ children }) => (
  <svg className="chat-hold-menu-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    {children}
  </svg>
);

const mediaMessage = (message) => Boolean(
  message?.gif
  || message?.video?.url
  || message?.animationId
  || message?.animated
  || emojiOnlyCount(message?.text)
);

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ChatMessageHold = forwardRef(({ message, anchor, lang, onClose, onReply, onEdit, onCopy, onPin, onUnpin, onDelete, onPick, onMore, onDownloadVideo }, ref) => {
  const ru = lang === 'ru';
  const mine = message.mine === true;
  const canEdit = mine && !message.gif && !message.video?.url && !message.animationId && message.animated !== true && String(message.text || '').trim();
  const quick = QUICK.map((id) => emojiFromId(id)).filter(Boolean);
  const stageRef = useRef(null);
  const closingRef = useRef(false);
  const openedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const [spot, setSpot] = useState(null);
  const [ready, setReady] = useState(false);
  const [moved, setMoved] = useState(false);
  const [shown, setShown] = useState(false);
  const [bursting, setBursting] = useState(false);
  const shownRef = useRef(false);
  const burstLayerRef = useRef(null);
  onCloseRef.current = onClose;
  shownRef.current = shown;

  useLayoutEffect(() => {
    const node = stageRef.current;
    if (!node) return undefined;
    const reactions = node.querySelector('.chat-hold-reactions');
    const menu = node.querySelector('.chat-hold-menu');
    const bubble = node.querySelector('.chat-hold-bubble');
    const above = (reactions?.offsetHeight || 44) + 8;
    const below = (menu?.offsetHeight || 156) + 8;
    const bubbleH = bubble?.offsetHeight || node.offsetHeight || 48;
    const bubbleW = bubble?.offsetWidth || node.offsetWidth || 0;
    const groupW = Math.max(bubbleW, menu?.offsetWidth || 228, reactions?.offsetWidth || 0);
    const narrow = node.classList.contains('is-narrow');
    const total = above + bubbleH + below;
    const page = document.querySelector('.chat')?.getBoundingClientRect();
    const pageLeft = page?.left || 0;
    const pageTop = page?.top || 0;
    const pageWidth = page?.width || window.innerWidth;
    const pageHeight = page?.height || window.innerHeight;
    const inset = 16;
    const visualTop = pageTop + Math.max(inset, Math.round((pageHeight - total) / 2));
    const top = visualTop + above;
    const centerX = pageLeft + pageWidth / 4;
    const minLeft = pageLeft + inset;
    const maxLeft = Math.max(minLeft, pageLeft + pageWidth - groupW - inset);
    const axis = Math.min(Math.max(minLeft + groupW / 2, centerX), maxLeft + groupW / 2);
    const left = narrow
      ? Math.round(axis - bubbleW / 2)
      : Math.min(maxLeft, Math.max(minLeft, Math.round(centerX - groupW / 2)));
    setSpot({
      left,
      top,
      fromX: (anchor?.left ?? left) - left,
      fromY: (anchor?.top ?? top) - top,
    });
    return undefined;
  }, [anchor]);

  useEffect(() => {
    if (!spot || openedRef.current) return undefined;
    const bubble = stageRef.current?.querySelector('.chat-hold-bubble');
    if (!bubble || reducedMotion()) {
      openedRef.current = true;
      setReady(true);
      setMoved(true);
      setShown(true);
      return undefined;
    }
    let revealed = false;
    let tries = 0;
    let retry = 0;
    const reveal = () => {
      if (revealed || closingRef.current) return;
      const stage = stageRef.current;
      const gap = stage
        ? Math.abs(bubble.getBoundingClientRect().top - stage.getBoundingClientRect().top)
        : 0;
      if (gap > 22 && tries < 50) {
        tries += 1;
        retry = window.requestAnimationFrame(reveal);
        return;
      }
      revealed = true;
      openedRef.current = true;
      bubble.removeEventListener('transitionend', onEnd);
      window.cancelAnimationFrame(retry);
      setShown(true);
    };
    const onEnd = (event) => {
      if (event.target !== bubble || event.propertyName !== 'transform') return;
      reveal();
    };
    bubble.addEventListener('transitionend', onEnd);
    const arm = window.requestAnimationFrame(() => {
      setReady(true);
      window.requestAnimationFrame(() => {
        setMoved(true);
        retry = window.requestAnimationFrame(reveal);
      });
    });
    return () => {
      window.cancelAnimationFrame(arm);
      window.cancelAnimationFrame(retry);
      bubble.removeEventListener('transitionend', onEnd);
    };
  }, [spot]);

  const settle = (done) => {
    if (closingRef.current) {
      done?.();
      return;
    }
    closingRef.current = true;
    const bubble = stageRef.current?.querySelector('.chat-hold-bubble');
    if (!bubble || reducedMotion()) {
      done?.();
      return;
    }
    const flyBack = () => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        bubble.removeEventListener('transitionend', onEnd);
        window.clearTimeout(timer);
        done?.();
      };
      const onEnd = (event) => {
        if (event.target !== bubble || event.propertyName !== 'transform') return;
        finish();
      };
      const timer = window.setTimeout(finish, MOVE_MS + 80);
      bubble.addEventListener('transitionend', onEnd);
      setMoved(false);
    };
    if (!shownRef.current) {
      flyBack();
      return;
    }
    shownRef.current = false;
    setShown(false);
    const panels = stageRef.current?.querySelector('.chat-hold-reactions');
    let started = false;
    const go = (event) => {
      if (event && (event.target !== panels || event.propertyName !== 'opacity')) return;
      if (started) return;
      started = true;
      panels?.removeEventListener('transitionend', go);
      window.clearTimeout(backup);
      flyBack();
    };
    const backup = window.setTimeout(go, PANEL_MS);
    panels?.addEventListener('transitionend', go);
  };

  const shatter = (done) => {
    if (closingRef.current) {
      done?.();
      return;
    }
    closingRef.current = true;
    shownRef.current = false;
    setShown(false);
    setBursting(true);
    const bubble = stageRef.current?.querySelector('.chat-hold-bubble');
    if (!bubble || reducedMotion()) {
      done?.();
      return;
    }
    burstLayerRef.current = shatterElement(bubble);
    window.setTimeout(() => done?.(), SHATTER_MS);
  };

  useEffect(() => () => burstLayerRef.current?.remove(), []);

  useImperativeHandle(ref, () => ({
    close: (done) => settle(done || onCloseRef.current),
    shatter: (done) => shatter(done || onCloseRef.current),
  }), []);

  return createPortal(
    <div className={`chat-hold${bursting ? ' is-burst' : ''}`} role="presentation" onClick={() => { if (!bursting) settle(onClose); }}>
      <div
        ref={stageRef}
        className={`chat-hold-stage${mine ? ' is-mine' : ''}${mediaMessage(message) ? ' is-compact' : ''}${!message.gif && (message.animationId || message.animated || emojiOnlyCount(message.text)) ? ' is-narrow' : ''}${ready ? ' is-set' : ''}${shown ? ' is-shown' : ''}`}
        style={spot ? { left: spot.left, top: spot.top } : { visibility: 'hidden' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="chat-hold-reactions" role="toolbar" aria-label={ru ? 'Реакции' : 'Reaksiyalar'}>
          {quick.map((item, index) => (
            <button
              key={item.id}
              type="button"
              style={{ '--i': index }}
              onClick={() => settle(() => onPick?.(item))}
            >
              {item.char}
            </button>
          ))}
          <button type="button" className="is-more" style={{ '--i': quick.length }} onClick={onMore} aria-label={ru ? 'Ещё' : 'Yana'}>+</button>
        </div>
        <div
          className="chat-hold-bubble"
          style={spot ? {
            transform: moved
              ? 'translate(0px, 0px)'
              : `translate(${spot.fromX}px, ${spot.fromY}px)`,
            visibility: bursting ? 'hidden' : undefined,
          } : undefined}
        >
          <ChatMessageBlock
            text={message.text}
            mine={mine}
            quote={message.quote || ''}
            replyId={message.replyId || ''}
            animated={message.animated === true}
            animationId={message.animationId || ''}
            gif={message.gif || ''}
            video={message.video?.url ? message.video : null}
            downloadProgress={message.downloadProgress}
            onDownload={!mine && message.video?.url && !message.video.playback && !String(message.video.url).startsWith('blob:') && message.downloadProgress == null
              ? () => onDownloadVideo?.(message)
              : undefined}
            quoteAnimated={message.quoteAnimated === true}
            quoteAnimationId={message.quoteAnimationId || ''}
            quoteGif={message.quoteGif || ''}
          />
        </div>
        <div className="chat-hold-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => settle(onReply)}>
            <MenuIcon>
              <path d="M9 14 4.5 9.5 9 5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4.8 9.5H14a5.5 5.5 0 0 1 5.5 5.5V19" strokeLinecap="round" strokeLinejoin="round" />
            </MenuIcon>
            <span>{ru ? 'Ответить' : 'Javob berish'}</span>
          </button>
          {canEdit ? (
            <button type="button" role="menuitem" onClick={() => settle(onEdit)}>
              <MenuIcon>
                <path d="M4 20h4.2L19 9.2a1.6 1.6 0 0 0 0-2.3l-1.9-1.9a1.6 1.6 0 0 0-2.3 0L4 15.8V20Z" strokeLinejoin="round" />
                <path d="M12.6 6.4l5 5" strokeLinecap="round" />
              </MenuIcon>
              <span>{ru ? 'Изменить' : 'Tahrirlash'}</span>
            </button>
          ) : null}
          <button type="button" role="menuitem" onClick={() => settle(onCopy)}>
            <MenuIcon>
              <rect x="8" y="8" width="12" height="12" rx="2.2" />
              <path d="M6 16H5.2A1.2 1.2 0 0 1 4 14.8V5.2A1.2 1.2 0 0 1 5.2 4H14.8A1.2 1.2 0 0 1 16 5.2V6" strokeLinecap="round" />
            </MenuIcon>
            <span>{ru ? 'Копировать' : 'Nusxa olish'}</span>
          </button>
          {message.pinned ? (
            <button type="button" role="menuitem" onClick={() => settle(onUnpin)}>
              <MenuIcon>
                <path d="M9 4.2h6l-.8 5.2 2.6 2.4H7.2L9.8 9.4 9 4.2Z" strokeLinejoin="round" />
                <path d="M12 11.8V20" strokeLinecap="round" />
                <path d="M5 19 19 5" strokeLinecap="round" />
              </MenuIcon>
              <span>{ru ? 'Открепить' : 'Yechib olish'}</span>
            </button>
          ) : (
            <button type="button" role="menuitem" onClick={onPin}>
              <MenuIcon>
                <path d="M9 4.2h6l-.8 5.2 2.6 2.4H7.2L9.8 9.4 9 4.2Z" strokeLinejoin="round" />
                <path d="M12 11.8V20" strokeLinecap="round" />
              </MenuIcon>
              <span>{ru ? 'Закрепить' : 'Qadash'}</span>
            </button>
          )}
          <button type="button" role="menuitem" className="is-danger" onClick={onDelete}>
            <MenuIcon>
              <path d="M4.5 7h15" strokeLinecap="round" />
              <path d="M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7" strokeLinecap="round" />
              <path d="M7.2 7 8 19.2A1.2 1.2 0 0 0 9.2 20.2h5.6a1.2 1.2 0 0 0 1.2-1L16.8 7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 10.5v6M14 10.5v6" strokeLinecap="round" />
            </MenuIcon>
            <span>{ru ? 'Удалить' : 'O‘chirish'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
});

export default ChatMessageHold;
