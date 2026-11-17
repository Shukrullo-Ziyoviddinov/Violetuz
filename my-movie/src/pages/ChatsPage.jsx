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

    const syncVisibleHeight = () => {
      const viewport = window.visualViewport;
      const offsetTop = viewport ? viewport.offsetTop : 0;
      const fromViewport = viewport
        ? Math.max(0, window.innerHeight - offsetTop - viewport.height)
        : 0;
      const fromKeyboard = keyboard?.boundingRect?.height || 0;
      const keyboardOpen = Math.max(fromViewport, fromKeyboard) > 120;
      root.style.setProperty('--chat-visible-top', keyboardOpen ? '0px' : `${Math.round(offsetTop)}px`);
      root.style.setProperty('--chat-visible-bottom', keyboardOpen ? '0px' : `${Math.round(fromViewport)}px`);
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

    return () => {
      window.visualViewport?.removeEventListener('resize', syncVisibleHeight);
      window.visualViewport?.removeEventListener('scroll', syncVisibleHeight);
      window.removeEventListener('resize', syncVisibleHeight);
      keyboard?.removeEventListener('geometrychange', syncVisibleHeight);
      document.removeEventListener('focusin', syncVisibleHeight);
      document.removeEventListener('focusout', syncVisibleHeight);
      if (keyboard) keyboard.overlaysContent = previousOverlay;
      root.classList.remove('chat-page-lock');
      document.body.classList.remove('chat-page-active');
      root.style.removeProperty('--chat-visible-top');
      root.style.removeProperty('--chat-visible-bottom');
    };
  }, []);

  return (
    <div className="chats-page">
      <Chat userId={userId} />
    </div>
  );
};

export default ChatsPage;
