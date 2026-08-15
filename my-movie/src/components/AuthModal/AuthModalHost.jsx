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
  const [copyVariant, setCopyVariant] = useState('default');

  const openModal = useCallback((nextMode = 'register', options = {}) => {
    if (readNeedsAvatar() && options.step !== 'form') {
      setMode('register');
      setStep('avatar');
      setOpen(true);
      return;
    }
    setMode(nextMode === 'login' ? 'login' : 'register');
    setStep(options.step === 'avatar' ? 'avatar' : 'form');
    setCopyVariant(options.copyVariant === 'addAccount' ? 'addAccount' : 'default');
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
    if (readNeedsAvatar()) return;
    setOpen(false);
    setStep('form');
    setCopyVariant('default');
  }, []);

  if (!open) return null;

  return (
    <AuthModal
      mode={mode}
      step={step}
      copyVariant={copyVariant}
      onModeChange={(next) => {
        if (readNeedsAvatar() || step === 'avatar') return;
        setMode(next);
        setStep('form');
        if (next === 'login') setCopyVariant('default');
      }}
      onStepChange={setStep}
      onClose={handleClose}
    />
  );
};

export default AuthModalHost;
