import React from 'react';
import { useParams } from 'react-router-dom';
import Chat from '../components/Message/Chat/Chat';
import './ChatsPage.css';

const ChatsPage = () => {
  const { userId } = useParams();

  return (
    <div className="chats-page">
      <Chat userId={userId} />
    </div>
  );
};

export default ChatsPage;
