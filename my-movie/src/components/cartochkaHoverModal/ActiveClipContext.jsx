import React, { createContext, useContext, useState, useCallback } from 'react';

const ActiveClipContext = createContext(null);

export const useActiveClip = () => useContext(ActiveClipContext);

export const ActiveClipProvider = ({ children }) => {
  const [activeId, setActiveIdState] = useState(null);

  const setActiveId = useCallback((id) => {
    setActiveIdState(id);
  }, []);

  return (
    <ActiveClipContext.Provider value={{ activeId, setActiveId }}>
      {children}
    </ActiveClipContext.Provider>
  );
};
