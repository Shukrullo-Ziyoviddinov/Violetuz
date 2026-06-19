import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ComentariaHistoryModal from './ComentariaHistoryModal';
import './ComentariaHistory.css';

const ComentariaHistory = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="profile-page-likes-link comentaria-history-link"
        onClick={() => setOpen(true)}
        aria-label={t('profilePage.quickLinks.comments')}
      >
        <span className="comentaria-history-icon-wrap" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </span>
        <span className="profile-page-likes-label">{t('profilePage.quickLinks.comments')}</span>
      </button>
      <ComentariaHistoryModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default ComentariaHistory;
