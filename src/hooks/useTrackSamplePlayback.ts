'use client';

import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { currentStepAtom, getSequencerStepsAtom, getQuantizationAtom, isPlayingAtom, getMuteAtom } from '@/store/atoms';
import { useDrumSamples } from './useDrumSamples';

export const useTrackSamplePlayback = (trackIndex: number) => {
  const currentStep = useAtomValue(currentStepAtom);
  const isPlaying = useAtomValue(isPlayingAtom);
  const sequencerSteps = useAtomValue(getSequencerStepsAtom(trackIndex));
  const quantizationEnabled = useAtomValue(getQuantizationAtom(trackIndex));
  const muteEnabled = useAtomValue(getMuteAtom(trackIndex));
  const drumSamples = useDrumSamples(trackIndex);

  // Play sample when we hit an active step during quantized playback
  useEffect(() => {
    if (isPlaying && quantizationEnabled && sequencerSteps[currentStep] && !muteEnabled) {
      drumSamples.playSample();
    }
  }, [currentStep, isPlaying, quantizationEnabled, sequencerSteps, muteEnabled, drumSamples, trackIndex]);
}; 