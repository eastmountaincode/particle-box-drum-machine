'use client';

import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { currentStepAtom, getSequencerStepsAtom, getQuantizationAtom, isPlayingAtom, getMuteAtom, getFreezeAtom } from '@/store/atoms';
import { useDrumSamples } from './useDrumSamples';

export const useTrackSamplePlayback = (trackIndex: number) => {
  const currentStep = useAtomValue(currentStepAtom);
  const isPlaying = useAtomValue(isPlayingAtom);
  const sequencerSteps = useAtomValue(getSequencerStepsAtom(trackIndex));
  const quantizationEnabled = useAtomValue(getQuantizationAtom(trackIndex));
  const freezeEnabled = useAtomValue(getFreezeAtom(trackIndex));
  const muteEnabled = useAtomValue(getMuteAtom(trackIndex));
  const drumSamples = useDrumSamples(trackIndex);

  // Play sample when we hit an active step during quantized playback
  useEffect(() => {
    // When freeze is ON, play samples for active steps (pattern is locked)
    // When freeze is OFF, the quantization system handles sample playback directly
    // to ensure samples only play when there was an actual collision
    if (isPlaying && quantizationEnabled && freezeEnabled && !muteEnabled && sequencerSteps[currentStep]) {
      drumSamples.playSample();
    }
  }, [currentStep, isPlaying, quantizationEnabled, freezeEnabled, sequencerSteps, muteEnabled, drumSamples, trackIndex]);
}; 