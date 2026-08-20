'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { isPlayingAtom, getSequencerStepsAtom, getQuantizationAtom, getFreezeAtom, getMuteAtom } from '@/store/atoms';

interface QuantizationConfig {
  trackIndex: number;
  playSample: (velocity?: number, time?: number) => void;
}

export const useQuantization = ({ trackIndex, playSample }: QuantizationConfig) => {
  const isPlaying = useAtomValue(isPlayingAtom);
  const quantizationEnabled = useAtomValue(getQuantizationAtom(trackIndex));
  const freezeEnabled = useAtomValue(getFreezeAtom(trackIndex));
  const muteEnabled = useAtomValue(getMuteAtom(trackIndex));
  const setSequencerSteps = useSetAtom(getSequencerStepsAtom(trackIndex));
  const pendingHitRef = useRef(false);

  // Function to register a collision/hit
  const registerHit = useCallback(() => {
    // Skip collision registration if frozen - pattern is locked
    if (!quantizationEnabled || !isPlaying || freezeEnabled) return;

    // Tone invokes the next step callback early enough to schedule its audio.
    // Collisions collected between callbacks are consumed by the next schedulable
    // 16th note, without relying on requestAnimationFrame-driven React state.
    pendingHitRef.current = true;
  }, [quantizationEnabled, isPlaying, freezeEnabled]);

  const onStepTriggered = useCallback((step: number, time?: number) => {
    if (!quantizationEnabled || freezeEnabled) return;

    const shouldActivateStep = pendingHitRef.current;
    pendingHitRef.current = false;

    setSequencerSteps((previousSteps) => {
      if (previousSteps[step] === shouldActivateStep) return previousSteps;

      const nextSteps = [...previousSteps];
      nextSteps[step] = shouldActivateStep;
      return nextSteps;
    });

    if (shouldActivateStep && !muteEnabled) {
      playSample(1, time);
    }
  }, [freezeEnabled, muteEnabled, playSample, quantizationEnabled, setSequencerSteps]);

  // Clear all pending hits when stopping or freezing
  useEffect(() => {
    if (!isPlaying || freezeEnabled || !quantizationEnabled) {
      pendingHitRef.current = false;
    }
  }, [isPlaying, freezeEnabled, quantizationEnabled]);

  return {
    registerHit,
    onStepTriggered,
    isQuantizing: quantizationEnabled && isPlaying,
  };
};
