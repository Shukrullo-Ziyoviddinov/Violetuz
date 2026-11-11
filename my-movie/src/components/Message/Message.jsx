import React from 'react';
import { useTranslation } from 'react-i18next';
import './Message.css';

const Message = () => {
  const { t } = useTranslation();

  return (
    <section className="message" aria-labelledby="message-page-title">
      <h1 id="message-page-title" className="message-title">
        {t('feed.messages')}
      </h1>
    </section>
  );
};

export default Message;
