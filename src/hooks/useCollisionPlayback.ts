'use client';

import { useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { getQuantizationAtom, getMuteAtom } from '@/store/atoms';

interface UseCollisionPlaybackReturn {
  onCollisionHit: (time?: number) => void;
}

export const useCollisionPlayback = (
  trackIndex: number,
  playSample: (velocity?: number, time?: number) => void
): UseCollisionPlaybackReturn => {
  const quantizationEnabled = useAtomValue(getQuantizationAtom(trackIndex));
  const muteEnabled = useAtomValue(getMuteAtom(trackIndex));

  const onCollisionHit = useCallback((time?: number) => {
    // Play sample immediately if quantization is OFF and not muted
    // (This handles both freeze ON and OFF cases when quantization is disabled)
    if (!quantizationEnabled && !muteEnabled) {
      playSample(1, time);
    }
  }, [quantizationEnabled, muteEnabled, playSample]);

  return {
    onCollisionHit
  };
};
