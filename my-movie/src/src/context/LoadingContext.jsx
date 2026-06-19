import React, { createContext, useContext, useState, useCallback } from 'react';

const LoadingContext = createContext(null);

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  return ctx || { isLoading: false, setLoading: () => {} };
};

export const LoadingProvider = ({ children }) => {
  const [navbarLoading, setNavbarLoading] = useState(false);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [recommendedLoading, setRecommendedLoading] = useState(false);

  const setLoading = useCallback((key, value) => {
    const setters = {
      navbar: setNavbarLoading,
      movies: setMoviesLoading,
      profile: setProfileLoading,
      detail: setDetailLoading,
      banner: setBannerLoading,
      categories: setCategoriesLoading,
      wishlist: setWishlistLoading,
      recommended: setRecommendedLoading,
    };
    if (setters[key]) setters[key](!!value);
  }, []);

  const value = {
    navbarLoading,
    moviesLoading,
    profileLoading,
    detailLoading,
    bannerLoading,
    categoriesLoading,
    wishlistLoading,
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
