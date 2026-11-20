import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Chat from '../components/Message/Chat/Chat';
import './ChatsPage.css';

const ChatsPage = () => {
  const { userId } = useParams();

  useEffect(() => {
    const root = document.documentElement;
    const keyboard = navigator.virtualKeyboard;
    const previousOverlay = keyboard ? keyboard.overlaysContent : false;
    if (keyboard) keyboard.overlaysContent = true;

    const motionMs = 450;
    const atBottomPx = 48;
    let lastLift = 0;
    let pinBottom = false;
    let pinFrame = 0;
    let followLatest = false;
    let decided = false;
    let settleTimer = 0;

    const stopPin = () => {
      pinBottom = false;
      if (pinFrame) window.cancelAnimationFrame(pinFrame);
      pinFrame = 0;
    };

    const distanceFromBottom = (node) => node.scrollHeight - node.scrollTop - node.clientHeight;

    const followBottom = (until) => {
      const step = () => {
        const node = document.querySelector('.chat-thread');
        if (!pinBottom || !node) return;
        node.scrollTop = node.scrollHeight;
        if (performance.now() < until) pinFrame = window.requestAnimationFrame(step);
        else pinBottom = false;
      };
      if (pinFrame) window.cancelAnimationFrame(pinFrame);
      pinFrame = window.requestAnimationFrame(step);
    };

    const settleDecision = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        decided = false;
        followLatest = false;
        pinBottom = false;
      }, motionMs + 80);
    };

    const releasePin = (event) => {
      if (!event.target?.closest?.('.chat-thread')) return;
      stopPin();
      followLatest = false;
      decided = true;
      settleDecision();
    };

    const syncVisibleHeight = () => {
      const viewport = window.visualViewport;
      const offsetTop = viewport ? viewport.offsetTop : 0;
      const fromViewport = viewport
        ? Math.max(0, window.innerHeight - offsetTop - viewport.height)
        : 0;
      const fromKeyboard = keyboard?.boundingRect?.height || 0;
      const inset = Math.max(fromViewport, fromKeyboard);
      const keyboardOpen = inset > 120;
      const keyboardLift = keyboardOpen ? Math.round(inset) : 0;
      const thread = document.querySelector('.chat-thread');
      root.style.setProperty('--chat-visible-top', keyboardOpen ? '0px' : `${Math.round(offsetTop)}px`);
      root.style.setProperty('--chat-visible-bottom', keyboardOpen ? '0px' : `${Math.round(fromViewport)}px`);
      root.style.setProperty('--chat-keyboard-lift', `${keyboardLift}px`);
      if (keyboardLift !== lastLift) {
        if (!decided) {
          followLatest = thread ? distanceFromBottom(thread) <= atBottomPx : false;
          decided = true;
        }
        if (thread && followLatest) {
          pinBottom = true;
          followBottom(performance.now() + motionMs);
        } else {
          stopPin();
        }
        settleDecision();
      }
      lastLift = keyboardLift;
    };

    root.classList.add('chat-page-lock');
    document.body.classList.add('chat-page-active');
    syncVisibleHeight();
    window.visualViewport?.addEventListener('resize', syncVisibleHeight);
    window.visualViewport?.addEventListener('scroll', syncVisibleHeight);
    window.addEventListener('resize', syncVisibleHeight);
    keyboard?.addEventListener('geometrychange', syncVisibleHeight);
    document.addEventListener('focusin', syncVisibleHeight);
    document.addEventListener('focusout', syncVisibleHeight);
    document.addEventListener('pointerdown', releasePin, true);

    return () => {
      window.visualViewport?.removeEventListener('resize', syncVisibleHeight);
      window.visualViewport?.removeEventListener('scroll', syncVisibleHeight);
      window.removeEventListener('resize', syncVisibleHeight);
      keyboard?.removeEventListener('geometrychange', syncVisibleHeight);
      document.removeEventListener('focusin', syncVisibleHeight);
      document.removeEventListener('focusout', syncVisibleHeight);
      document.removeEventListener('pointerdown', releasePin, true);
      window.clearTimeout(settleTimer);
      stopPin();
      if (keyboard) keyboard.overlaysContent = previousOverlay;
      root.classList.remove('chat-page-lock');
      document.body.classList.remove('chat-page-active');
      root.style.removeProperty('--chat-visible-top');
      root.style.removeProperty('--chat-visible-bottom');
      root.style.removeProperty('--chat-keyboard-lift');
    };
  }, []);

  return (
    <div className="chats-page">
      <Chat userId={userId} />
    </div>
  );
};

export default ChatsPage;
