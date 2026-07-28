import React, { useEffect, useState, useCallback } from 'react';
import AuthModal from './AuthModal';
import { setAuthModalHandler, clearAuthModalHandler } from '../../authModalBridge';

const AuthModalHost = () => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('register');

  const openModal = useCallback((nextMode = 'register') => {
    setMode(nextMode === 'login' ? 'login' : 'register');
    setOpen(true);
  }, []);

  useEffect(() => {
    setAuthModalHandler(openModal);
    return () => clearAuthModalHandler(openModal);
  }, [openModal]);

  if (!open) return null;

  return (
    <AuthModal
      initialMode={mode}
      onClose={() => setOpen(false)}
    />
  );
};

export default AuthModalHost;
