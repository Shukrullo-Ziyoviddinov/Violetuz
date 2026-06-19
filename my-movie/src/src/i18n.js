import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import uzTranslations from './locales/uz/translation.json';
import ruTranslations from './locales/ru/translation.json';

const savedLanguage = localStorage.getItem('i18nextLng') || 'uz';
const validLanguage = (savedLanguage === 'uz' || savedLanguage === 'ru') ? savedLanguage : 'uz';

const languageDetectorOptions = {
  order: ['localStorage', 'navigator'],
  lookupLocalStorage: 'i18nextLng',
  caches: ['localStorage']
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      uz: {
        translation: uzTranslations
      },
      ru: {
        translation: ruTranslations
      }
    },
    lng: validLanguage,
    fallbackLng: 'uz',
    defaultNS: 'translation',
    detection: languageDetectorOptions,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
