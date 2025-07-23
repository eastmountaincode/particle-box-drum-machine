'use client';

import { useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { getQuantizationAtom, getMuteAtom } from '@/store/atoms';
import { useDrumSamples } from './useDrumSamples';

interface UseCollisionPlaybackReturn {
  onCollisionHit: () => void;
}

export const useCollisionPlayback = (trackIndex: number): UseCollisionPlaybackReturn => {
  const quantizationEnabled = useAtomValue(getQuantizationAtom(trackIndex));
  const muteEnabled = useAtomValue(getMuteAtom(trackIndex));
  const drumSamples = useDrumSamples(trackIndex);

  const onCollisionHit = useCallback(() => {
    // Play sample immediately if quantization is OFF and not muted
    // (This handles both freeze ON and OFF cases when quantization is disabled)
    if (!quantizationEnabled && !muteEnabled) {
      drumSamples.playSample();
    }
  }, [quantizationEnabled, muteEnabled, drumSamples, trackIndex]);

  return {
    onCollisionHit
  };
}; 