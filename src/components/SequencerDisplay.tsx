'use client'

import React from 'react';
import { useAtomValue } from 'jotai';
import { getFreezeAtom, getQuantizationAtom, getMuteAtom } from '@/store/atoms';
import { InlineTooltip } from './Tutorial/InlineTooltip';
import { useTutorial } from './Tutorial/TutorialContext';

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

  // Tutorial state
  const { isTutorialActive } = useTutorial();

  // Background color logic:
  // - If MUTED: Always black (everything keeps running in background, just no visual)
  // - Quantization ON + Freeze OFF: Red (signal from both particle box and sequencer)
  // - Quantization OFF + Freeze OFF: Black (signal only from particle box)  
  // - Quantization ON + Freeze ON: Red (signal only from sequencer)
  // - Quantization OFF + Freeze ON: Black (signal only from particle box)
  //const backgroundColor = muteEnabled ? 'bg-black' : (quantizationEnabled ? 'bg-red-600' : 'bg-black');
  const backgroundColor = 'bg-black';
  const isRedBackground = quantizationEnabled;

  return (
    <div className={`w-full h-full ${backgroundColor} border border-white p-2 flex items-center justify-center relative`}>
      {!muteEnabled && (
        <div className="flex gap-1">
          {steps.map((isActive, index) => {
            const isCurrent = index === currentStep;
            const isActiveAndCurrent = isActive && isCurrent;
            const isQuarterNote = index % 4 === 0; // Quarter notes at indices 0, 4, 8, 12
            const isLastStep = index === 15; // Last step for tooltip

            // Simple logic: white background = current step, circle = active step
            let className = 'w-8 h-8 cursor-pointer ';
            let textColor = '';
            className += 'border border-white ';


            if (isCurrent) {
              // Current step gets white background
              className += 'bg-white ';
              // Active dot color should match the sequencer background theme:
              // If sequencer background is red, use red dot; if black background, use black dot
              textColor = (isActiveAndCurrent && isRedBackground) ? 'text-black' : 'text-black';
            } else {
              // Non-current steps get transparent background with hover
              className += 'bg-transparent hover:bg-gray-800 ';
              textColor = 'text-white';
            }

            className += textColor;

            return (
              <div key={index} className={`flex flex-col items-center ${isLastStep ? 'relative' : ''}`}>
                {/* Quarter note indicator */}
                {isQuarterNote && (
                  <div className="h-2 flex items-center justify-center mb-1">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                  </div>
                )}
                {/* Non-quarter note spacer */}
                {!isQuarterNote && (
                  <div className="h-2 mb-1"></div>
                )}

                {/* Step button */}
                <div
                  className={className}
                  onClick={() => onStepToggle(index)}
                  title={`Step ${index + 1}${isQuarterNote ? ' (Quarter Note)' : ''} - ${isCurrent ? 'Current' : ''}${isActive ? ' Active' : ''}`}
                >
                  <div className="w-full h-full flex items-center justify-center text-lg">
                    {isActive ? '●' : ''}
                  </div>
                </div>

                {/* Tooltip on last step for track 3 */}
                {isLastStep && trackNumber === 3 && (
                  <InlineTooltip
                    title="Step Sequencer"
                    content={`• Click steps to manually activate pads.
• Dots show active steps.
• Remember, if FREEZE is off, all input to the sequencer is coming from Particle Box collisions. Any manual activation will be overwritten by input from Particle Box if FREEZE is on.`}
                    position="right"
                    isVisible={isTutorialActive}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};