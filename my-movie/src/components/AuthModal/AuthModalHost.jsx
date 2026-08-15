import React, { useEffect, useState, useCallback } from 'react';
import AuthModal from './AuthModal';
import { useAuth } from '../../context/AuthContext';
import {
  setAuthModalHandler,
  clearAuthModalHandler,
  readNeedsAvatar,
  clearNeedsAvatar,
  markNeedsAvatar,
} from '../../authModalBridge';

const AuthModalHost = () => {
  const { authReady, isLoggedIn, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('register');
  const [step, setStep] = useState('form');

  const openModal = useCallback((nextMode = 'register', options = {}) => {
    if (readNeedsAvatar() && options.step !== 'form') {
      setMode('register');
      setStep('avatar');
      setOpen(true);
      return;
    }
    setMode(nextMode === 'login' ? 'login' : 'register');
    setStep(options.step === 'avatar' ? 'avatar' : 'form');
    setOpen(true);
  }, []);

  useEffect(() => {
    setAuthModalHandler(openModal);
    return () => clearAuthModalHandler(openModal);
  }, [openModal]);

  /**
   * Avatar majburiy: sessiya bor, rasm yo‘q → avatar qadami.
   * Saqlangach profile.avatar paydo bo‘ladi va modal yopilishi mumkin.
   */
  useEffect(() => {
    if (!authReady || !isLoggedIn) return;

    if (profile?.avatar) {
      clearNeedsAvatar();
      return;
    }

    markNeedsAvatar();
    setMode('register');
    setStep('avatar');
    setOpen(true);
  }, [authReady, isLoggedIn, profile?.avatar]);

  const handleClose = useCallback(() => {
    /* Faqat rasm hali majburiy bo‘lsa yopilmasin (saqlagach flag tozalanadi) */
    if (readNeedsAvatar()) return;
    setOpen(false);
    setStep('form');
  }, []);

  if (!open) return null;

  return (
    <AuthModal
      mode={mode}
      step={step}
      onModeChange={(next) => {
        if (readNeedsAvatar() || step === 'avatar') return;
        setMode(next);
        setStep('form');
      }}
      onStepChange={setStep}
      onClose={handleClose}
    />
  );
};

export default AuthModalHost;
