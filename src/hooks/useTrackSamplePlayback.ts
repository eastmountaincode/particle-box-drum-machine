'use client';

import { useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { getSequencerStepsAtom, getQuantizationAtom, getMuteAtom, getFreezeAtom } from '@/store/atoms';
import { useDrumSamples } from './useDrumSamples';

interface UseTrackSamplePlaybackReturn {
  onStepTriggered: (step: number) => void;
}

export const useTrackSamplePlayback = (trackIndex: number): UseTrackSamplePlaybackReturn => {
  const sequencerSteps = useAtomValue(getSequencerStepsAtom(trackIndex));
  const quantizationEnabled = useAtomValue(getQuantizationAtom(trackIndex));
  const freezeEnabled = useAtomValue(getFreezeAtom(trackIndex));
  const muteEnabled = useAtomValue(getMuteAtom(trackIndex));
  const drumSamples = useDrumSamples(trackIndex);

  // Return a callback that can be called by the audio engine at the precise timing
  const onStepTriggered = useCallback((step: number) => {
    // When freeze is ON, play samples for active steps (pattern is locked)
    // When freeze is OFF, the quantization system handles sample playback directly
    // to ensure samples only play when there was an actual collision
    if (quantizationEnabled && freezeEnabled && !muteEnabled && sequencerSteps[step]) {
      drumSamples.playSample();
    }
  }, [quantizationEnabled, freezeEnabled, sequencerSteps, muteEnabled, drumSamples]);

  return {
    onStepTriggered
  };
}; 