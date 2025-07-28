'use client';

import React, { createContext, useContext, useState } from 'react';

interface TutorialContextType {
  isTutorialActive: boolean;
  setTutorialActive: (active: boolean) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTutorialActive, setTutorialActive] = useState(false);

  return (
    <TutorialContext.Provider value={{ isTutorialActive, setTutorialActive }}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};