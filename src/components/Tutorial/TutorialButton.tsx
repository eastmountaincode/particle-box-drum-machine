'use client';

import React from 'react';

interface TutorialButtonProps {
  onClick: () => void;
  isActive: boolean;
}

export const TutorialButton: React.FC<TutorialButtonProps> = ({ onClick, isActive }) => {
  return (
    <button
      onClick={onClick}
      className={`text-xs py-2 px-3 border border-white border-opacity-50 cursor-pointer ${
        isActive 
          ? 'bg-white text-black' 
          : 'bg-black text-white hover:bg-white hover:text-black'
      }`}
      title={isActive ? "Hide Help Overlay" : "Show Help Overlay"}
    >
      ?
    </button>
  );
};