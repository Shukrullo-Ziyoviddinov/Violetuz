import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AUTH_STORAGE_KEY = 'violet_user_authenticated';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return { isLoggedIn: false, setLoggedIn: () => {} };
  }
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedInState] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    setIsLoggedInState(stored === 'true');
  }, []);

  const setLoggedIn = useCallback((value) => {
    setIsLoggedInState(!!value);
    localStorage.setItem(AUTH_STORAGE_KEY, value ? 'true' : 'false');
  }, []);

  const value = {
    isLoggedIn,
    setLoggedIn,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
