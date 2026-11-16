import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Chat from '../components/Message/Chat/Chat';
import './ChatsPage.css';

const ChatsPage = () => {
  const { userId } = useParams();

  useEffect(() => {
    const root = document.documentElement;
    const syncVisibleHeight = () => {
      const viewport = window.visualViewport;
      const top = viewport ? viewport.offsetTop : 0;
      const visibleBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
      const bottom = Math.max(0, window.innerHeight - visibleBottom);
      root.style.setProperty('--chat-visible-top', `${top}px`);
      root.style.setProperty('--chat-visible-bottom', `${bottom}px`);
    };

    root.classList.add('chat-page-lock');
    document.body.classList.add('chat-page-active');
    syncVisibleHeight();
    window.visualViewport?.addEventListener('resize', syncVisibleHeight);
    window.visualViewport?.addEventListener('scroll', syncVisibleHeight);
    window.addEventListener('resize', syncVisibleHeight);

    return () => {
      window.visualViewport?.removeEventListener('resize', syncVisibleHeight);
      window.visualViewport?.removeEventListener('scroll', syncVisibleHeight);
      window.removeEventListener('resize', syncVisibleHeight);
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
