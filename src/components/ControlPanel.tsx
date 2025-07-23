'use client';

import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { getSampleIndexAtom, getQuantizationAtom, getFreezeAtom } from '@/store/atoms';
import { getInstrumentForTrack, getSampleName, getSampleCount } from '@/utils/samples';

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
  const [sampleIndex, setSampleIndex] = useAtom(getSampleIndexAtom(trackNumber - 1));
  const [quantizationEnabled, setQuantizationEnabled] = useAtom(getQuantizationAtom(trackNumber - 1));
  const [freezeEnabled, setFreezeEnabled] = useAtom(getFreezeAtom(trackNumber - 1));
  const instrument = getInstrumentForTrack(trackNumber - 1);
  const currentSample = getSampleName(instrument, sampleIndex);
  const sampleCount = getSampleCount(instrument);

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

  const handleSamplePrevious = () => {
    setSampleIndex(sampleIndex > 0 ? sampleIndex - 1 : sampleCount - 1);
  };

  const handleSampleNext = () => {
    setSampleIndex(sampleIndex < sampleCount - 1 ? sampleIndex + 1 : 0);
  };

  const handleQuantizationToggle = () => {
    setQuantizationEnabled(!quantizationEnabled);
  };

  const handleFreezeToggle = () => {
    setFreezeEnabled(!freezeEnabled);
  };

  return (
    <div className="w-full h-full bg-black border border-white border-opacity-50 p-2 flex flex-col gap-2">
      {/* Freeze pattern button */}
      <button 
        onClick={handleFreezeToggle}
        className={`flex-1 text-xs px-2 border border-white border-opacity-50 cursor-pointer ${
          freezeEnabled 
            ? 'bg-white text-black' 
            : 'bg-black text-white hover:bg-white hover:text-black'
        }`}
      >
        FREEZE {freezeEnabled ? 'ON' : 'OFF'}
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

      {/* Sample selection control */}
      <div className="flex-1 flex flex-col border border-white border-opacity-50">
        <div className="flex-1 flex items-center">
          <button
            onClick={handleSamplePrevious}
            className="flex-1 h-full bg-black hover:bg-white hover:text-black text-white text-xs border-r border-white border-opacity-50 cursor-pointer"
          >
            ←
          </button>
          <div className="flex-2 h-full bg-black text-white text-xs flex items-center justify-center border-r border-white border-opacity-50 px-1">
            <span className="truncate text-center">{currentSample.replace('.WAV', '')}</span>
          </div>
          <button
            onClick={handleSampleNext}
            className="flex-1 h-full bg-black hover:bg-white hover:text-black text-white text-xs cursor-pointer"
          >
            →
          </button>
        </div>
      </div>

      {/* Q and Light toggle buttons row */}
      <div className="flex-1 flex items-center border border-white">
        <button
          onClick={handleQuantizationToggle}
          className={`flex-1 h-full text-xs border-r border-white cursor-pointer min-w-0 ${
            quantizationEnabled 
              ? 'bg-white text-black' 
              : 'bg-black text-white hover:bg-white hover:text-black'
          }`}
        >
          Q {quantizationEnabled ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={onLightingToggle}
          className={`flex-1 h-full text-xs cursor-pointer min-w-0 ${
            useLighting 
              ? 'bg-white text-black' 
              : 'bg-black text-white hover:bg-white hover:text-black'
          }`}
        >
          LIGHT {useLighting ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
};