'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import * as Tone from 'tone';
import { currentStepAtom, isPlayingAtom, getSequencerStepsAtom, getQuantizationAtom, getFreezeAtom } from '@/store/atoms';

interface QuantizationConfig {
  trackIndex: number;
  bpm: number;
}

export const useQuantization = ({ trackIndex, bpm }: QuantizationConfig) => {
  const currentStep = useAtomValue(currentStepAtom); 
  const isPlaying = useAtomValue(isPlayingAtom);
  const quantizationEnabled = useAtomValue(getQuantizationAtom(trackIndex));
  const freezeEnabled = useAtomValue(getFreezeAtom(trackIndex));
  const [sequencerSteps, setSequencerSteps] = useAtom(getSequencerStepsAtom(trackIndex));
  
  const pendingHitsRef = useRef<Map<number, boolean>>(new Map());
  const lastProcessedStepRef = useRef(-1);

  // Calculate quantization window (time before each step to capture hits)
  const quantizationWindowMs = useRef(0);
  
  useEffect(() => {
    // Calculate the duration of one 16th note in milliseconds
    const sixteenthNoteDurationMs = (60 / bpm) * 1000 / 4; // BPM to 16th note duration
    // Set quantization window to be 1/4 of the 16th note duration (adjust as needed)
    quantizationWindowMs.current = sixteenthNoteDurationMs * 0.25;
  }, [bpm]);

  // Process pending hits when step changes
  useEffect(() => {
    // Skip processing if frozen - pattern is locked
    if (!quantizationEnabled || !isPlaying || freezeEnabled) return;
    
    // If we've moved to a new step, check if we should activate it
    if (currentStep !== lastProcessedStepRef.current) {
      const shouldActivateStep = pendingHitsRef.current.get(currentStep);
      
      // Always update the step - either activate or deactivate based on whether there was a hit
      const newSteps = [...sequencerSteps];
      if (shouldActivateStep) {
        // Activate the step - there was a collision in the quantization window
        newSteps[currentStep] = true;
        // Clear the pending hit
        pendingHitsRef.current.delete(currentStep);
      } else {
        // Deactivate the step - no collision was registered in the quantization window  
        newSteps[currentStep] = false;
      }
      
      setSequencerSteps(newSteps);
      lastProcessedStepRef.current = currentStep;
    }
  }, [currentStep, quantizationEnabled, isPlaying, freezeEnabled, sequencerSteps, setSequencerSteps]);

  // Function to register a collision/hit
  const registerHit = useCallback(() => {
    // Skip collision registration if frozen - pattern is locked
    if (!quantizationEnabled || !isPlaying || freezeEnabled) return;
    
    // Simple approach: register hit for the next step
    // This creates a more predictable quantization behavior
    const nextStep = (currentStep + 1) % 16;
    
    // Register this hit for the next step
    pendingHitsRef.current.set(nextStep, true);
  }, [quantizationEnabled, isPlaying, freezeEnabled, currentStep, trackIndex]);

  // Clear all pending hits when stopping or freezing
  useEffect(() => {
    if (!isPlaying || freezeEnabled) {
      pendingHitsRef.current.clear();
      lastProcessedStepRef.current = -1;
    }
  }, [isPlaying, freezeEnabled]);

  return {
    registerHit,
    isQuantizing: quantizationEnabled && isPlaying,
  };
}; 