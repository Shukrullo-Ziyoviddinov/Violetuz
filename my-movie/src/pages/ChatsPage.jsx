import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Chat from '../components/Message/Chat/Chat';
import './ChatsPage.css';

const ChatsPage = () => {
  const { userId } = useParams();

  useEffect(() => {
    document.documentElement.classList.add('chat-page-lock');
    document.body.classList.add('chat-page-active');
    return () => {
      document.documentElement.classList.remove('chat-page-lock');
      document.body.classList.remove('chat-page-active');
    };
  }, []);

  return (
    <div className="chats-page">
      <Chat userId={userId} />
    </div>
  );
};

export default ChatsPage;
