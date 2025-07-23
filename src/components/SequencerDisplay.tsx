'use client'

import React from 'react';
import { useAtomValue } from 'jotai';
import { getFreezeAtom, getQuantizationAtom, getMuteAtom } from '@/store/atoms';

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
  const freezeEnabled = useAtomValue(getFreezeAtom(trackNumber - 1));
  const quantizationEnabled = useAtomValue(getQuantizationAtom(trackNumber - 1));
  const muteEnabled = useAtomValue(getMuteAtom(trackNumber - 1));
  
  // Background color logic:
  // - If MUTED: Always black (everything keeps running in background, just no visual)
  // - Quantization ON + Freeze OFF: Red (signal from both particle box and sequencer)
  // - Quantization OFF + Freeze OFF: Black (signal only from particle box)  
  // - Quantization ON + Freeze ON: Red (signal only from sequencer)
  // - Quantization OFF + Freeze ON: Black (signal only from particle box)
  const backgroundColor = muteEnabled ? 'bg-black' : (quantizationEnabled ? 'bg-red-600' : 'bg-black');
  const isRedBackground = quantizationEnabled;
  
  return (
    <div className={`w-full h-full ${backgroundColor} border border-white p-2 flex items-center justify-center`}>
      {!muteEnabled && (
        <div className="flex gap-1">
          {steps.map((isActive, index) => {
            const isCurrent = index === currentStep;
            const isActiveAndCurrent = isActive && isCurrent;
            
            // Simple logic: white background = current step, circle = active step
            let className = 'w-8 h-8 border border-white cursor-pointer ';
            let textColor = '';
            
            if (isCurrent) {
              // Current step gets white background
              className += 'bg-white ';
              // Active dot color should match the sequencer background theme:
              // If sequencer background is red, use red dot; if black background, use black dot
              textColor = (isActiveAndCurrent && isRedBackground) ? 'text-red-600' : 'text-black';
            } else {
              // Non-current steps get transparent background with hover
              className += 'bg-transparent hover:bg-gray-800 ';
              textColor = 'text-white';
            }
            
            className += textColor;
            
            return (
              <div
                key={index}
                className={className}
                onClick={() => onStepToggle(index)}
                title={`Step ${index + 1} - ${isCurrent ? 'Current' : ''}${isActive ? ' Active' : ''}`}
              >
                <div className="w-full h-full flex items-center justify-center text-lg">
                  {isActive ? '●' : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};