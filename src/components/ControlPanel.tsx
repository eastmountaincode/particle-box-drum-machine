'use client';

import React from 'react';

interface ControlPanelProps {
  trackNumber?: number;
  useLighting?: boolean;
  onLightingToggle?: () => void;
  particleCount?: number;
  onParticleCountChange?: (count: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  trackNumber = 1,
  useLighting = false,
  onLightingToggle,
  particleCount = 3,
  onParticleCountChange
}) => {
  const handleParticleDecrease = () => {
    if (onParticleCountChange && particleCount > 0) {
      onParticleCountChange(particleCount - 1);
    }
  };

  const handleParticleIncrease = () => {
    if (onParticleCountChange && particleCount < 10) {
      onParticleCountChange(particleCount + 1);
    }
  };

  return (
    <div className="w-full h-full bg-black border border-white border-opacity-50 p-2 flex flex-col gap-2">
      {/* Single column of buttons */}
      <button className="flex-1 bg-black hover:bg-white hover:text-black text-white text-xs px-2 border border-white border-opacity-50 cursor-pointer">
        FREEZE PATTERN
      </button>

      {/* Particle count control row */}
      <div className="flex-1 flex items-center border border-white border-opacity-50">
        <button
          onClick={handleParticleDecrease}
          className="flex-1 h-full bg-black hover:bg-white hover:text-black text-white text-xs border-r border-white border-opacity-50 cursor-pointer"
          disabled={particleCount <= 0}
        >
          -
        </button>
        <div className="flex-1 h-full bg-black text-white text-xs flex items-center justify-center border-r border-white border-opacity-50">
          {particleCount}
        </div>
        <button
          onClick={handleParticleIncrease}
          className="flex-1 h-full bg-black hover:bg-white hover:text-black text-white text-xs cursor-pointer"
          disabled={particleCount >= 10}
        >
          +
        </button>
      </div>

      <button
        onClick={onLightingToggle}
        className="flex-1 bg-black hover:bg-white hover:text-black text-white text-xs px-2 border border-white border-opacity-50 cursor-pointer"
      >
        {useLighting ? 'LIGHT ON' : 'LIGHT OFF'}
      </button>
    </div>
  );
};