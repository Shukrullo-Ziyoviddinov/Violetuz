import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ContentLanguageContext = createContext();

export const ContentLanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const [contentLang, setContentLang] = useState(i18n.language === 'uz' ? 'uz' : 'ru');

  useEffect(() => {
    setContentLang(i18n.language === 'uz' ? 'uz' : 'ru');
  }, [location.pathname, i18n.language]);

  return (
    <ContentLanguageContext.Provider value={{ contentLang, setContentLang }}>
      {children}
    </ContentLanguageContext.Provider>
  );
};

export const useContentLanguage = () => {
  const ctx = useContext(ContentLanguageContext);
  if (!ctx) {
    throw new Error('useContentLanguage must be used within ContentLanguageProvider');
  }
  return ctx;
};
