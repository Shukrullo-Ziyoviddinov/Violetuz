import React from 'react';
import { useNavigate } from 'react-router-dom';

const ChatOpenButton = ({ userId, className = '', children }) => {
  const navigate = useNavigate();
  const id = String(userId || '').trim();

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (!id) return;
        navigate(`/chats/${id}`);
      }}
    >
      {children}
    </button>
  );
};

export default ChatOpenButton;
