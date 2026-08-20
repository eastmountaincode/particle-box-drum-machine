'use client';

import { useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { getSequencerStepsAtom, getQuantizationAtom, getMuteAtom, getFreezeAtom } from '@/store/atoms';

interface UseTrackSamplePlaybackReturn {
  onStepTriggered: (step: number, time?: number) => void;
}

export const useTrackSamplePlayback = (
  trackIndex: number,
  playSample: (velocity?: number, time?: number) => void
): UseTrackSamplePlaybackReturn => {
  const sequencerSteps = useAtomValue(getSequencerStepsAtom(trackIndex));
  const quantizationEnabled = useAtomValue(getQuantizationAtom(trackIndex));
  const freezeEnabled = useAtomValue(getFreezeAtom(trackIndex));
  const muteEnabled = useAtomValue(getMuteAtom(trackIndex));
  // Return a callback that can be called by the audio engine at the precise timing
  const onStepTriggered = useCallback((step: number, time?: number) => {
    // When freeze is ON, play samples for active steps (pattern is locked)
    // When freeze is OFF, the quantization system handles sample playback directly
    // to ensure samples only play when there was an actual collision
    if (quantizationEnabled && freezeEnabled && !muteEnabled && sequencerSteps[step]) {
      playSample(1, time);
    }
  }, [quantizationEnabled, freezeEnabled, sequencerSteps, muteEnabled, playSample]);

  return {
    onStepTriggered
  };
};
