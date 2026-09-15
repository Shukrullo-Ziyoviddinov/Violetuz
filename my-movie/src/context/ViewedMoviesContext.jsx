/**
 * Haqiqiy tomosha (≥5 daqiqa / qisqa film ~80%) dan keyin saqlanadi —
 * detail ochish emas. SearchModalTavsiya local signal sifatida ishlatadi.
 * Format: { items: [{ id, typeCategory, filterGenre, filterCountry }] }
 *
 * Privacy: register / to‘liq logout da tozalanadi (guest rec history bilan bir xil
 * tamoyil — merge yo‘q, tiklash yo‘q).
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'violet_viewed_movies_v2';
const MAX_ITEMS = 50;

const getStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.items) ? parsed : { items: [] };
  } catch {
    return { items: [] };
  }
};

const saveStored = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('ViewedMovies save error:', e);
  }
};

/** Imperative wipe (AuthModal / logout — Context tashqarisidan ham). */
export const VIEWED_MOVIES_CLEARED_EVENT = 'violet:viewed-movies-cleared';

export const clearViewedMoviesHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(VIEWED_MOVIES_CLEARED_EVENT));
  }
};

const ViewedMoviesContext = createContext(null);

export const ViewedMoviesProvider = ({ children }) => {
  const [data, setData] = useState(getStored);

  useEffect(() => {
    saveStored(data);
  }, [data]);

  // AuthModal / logout imperative clear — state ham sync (LS qayta yozilmasin)
  useEffect(() => {
    const onCleared = () => setData({ items: [] });
    window.addEventListener(VIEWED_MOVIES_CLEARED_EVENT, onCleared);
    return () => window.removeEventListener(VIEWED_MOVIES_CLEARED_EVENT, onCleared);
  }, []);

  const addMovie = useCallback((movie) => {
    if (!movie?.id) return;
    const item = {
      id: movie.id,
      typeCategory: movie.typeCategory || [],
      filterGenre: movie.filterGenre || [],
      filterCountry: movie.filterCountry || null,
    };
    setData((prev) => {
      const filtered = prev.items.filter((i) => i.id !== movie.id);
      const next = [item, ...filtered].slice(0, MAX_ITEMS);
      return { items: next };
    });
  }, []);

  const clearViewed = useCallback(() => {
    clearViewedMoviesHistory();
    setData({ items: [] });
  }, []);

  const getViewedItems = useCallback(() => data.items, [data.items]);

  return (
    <ViewedMoviesContext.Provider value={{ addMovie, getViewedItems, clearViewed }}>
      {children}
    </ViewedMoviesContext.Provider>
  );
};

export const useViewedMovies = () => {
  const ctx = useContext(ViewedMoviesContext);
  if (!ctx) throw new Error('useViewedMovies must be used within ViewedMoviesProvider');
  return ctx;
};
