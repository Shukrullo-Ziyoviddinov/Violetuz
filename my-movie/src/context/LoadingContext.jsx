import React, { createContext, useContext, useState, useCallback } from 'react';

const LoadingContext = createContext(null);

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  return ctx || { isLoading: false, setLoading: () => {} };
};

export const LoadingProvider = ({ children }) => {
  const [recommendedLoading, setRecommendedLoading] = useState(false);

  const setLoading = useCallback((key, value) => {
    if (key === 'recommended') setRecommendedLoading(!!value);
  }, []);

  const value = {
    recommendedLoading,
    setLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export default LoadingContext;
