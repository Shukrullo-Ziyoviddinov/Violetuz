import React, { useEffect, useState, useCallback } from 'react';
import AuthModal from './AuthModal';
import { useAuth } from '../../context/AuthContext';
import {
  setAuthModalHandler,
  clearAuthModalHandler,
  readNeedsAvatar,
  clearNeedsAvatar,
} from '../../authModalBridge';

const AuthModalHost = () => {
  const { authReady, isLoggedIn, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('register');
  const [step, setStep] = useState('form');

  const openModal = useCallback((nextMode = 'register', options = {}) => {
    setMode(nextMode === 'login' ? 'login' : 'register');
    setStep(options.step === 'avatar' ? 'avatar' : 'form');
    setOpen(true);
  }, []);

  useEffect(() => {
    setAuthModalHandler(openModal);
    return () => clearAuthModalHandler(openModal);
  }, [openModal]);

  /** Register tugagan, lekin avatar yuklanmagan — refresh/yopilganda qayta ochish */
  useEffect(() => {
    if (!authReady || !isLoggedIn || open) return;

    const needsAvatar = readNeedsAvatar();
    const hasAvatar = Boolean(profile?.avatar);

    if (hasAvatar) {
      clearNeedsAvatar();
      return;
    }

    if (needsAvatar) {
      setMode('register');
      setStep('avatar');
      setOpen(true);
    }
  }, [authReady, isLoggedIn, profile?.avatar, open]);

  if (!open) return null;

  return (
    <AuthModal
      initialMode={mode}
      initialStep={step}
      onClose={() => {
        /* Avatar majburiy: flag hali turgan bo‘lsa yopilmasin */
        if (step === 'avatar' && readNeedsAvatar()) return;
        setOpen(false);
        setStep('form');
      }}
    />
  );
};

export default AuthModalHost;
