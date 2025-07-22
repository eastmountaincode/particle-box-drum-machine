'use client'

import React from 'react';

interface SequencerDisplayProps {
  trackNumber: number;
  currentStep: number;
  steps: boolean[]; // Array of 16 booleans indicating if step is active
  onStepToggle: (stepIndex: number) => void;
}

export const SequencerDisplay: React.FC<SequencerDisplayProps> = ({
  trackNumber,
  currentStep,
  steps,
  onStepToggle
}) => {
  return (
    <div className="w-full h-full bg-black border border-white p-2 flex items-center justify-center">
      <div className="flex gap-1">
        {steps.map((isActive, index) => (
          <div
            key={index}
            className={`w-8 h-8 border border-white ${index === currentStep && !isActive
                ? 'bg-white text-black'
                : ''
              }`}
          >

          </div>
        ))}
      </div>
    </div>
  );
};