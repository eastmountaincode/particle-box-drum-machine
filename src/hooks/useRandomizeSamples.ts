'use client'

import { useEffect, useRef } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { getSampleIndexAtom, selectedDrumKitIdAtom } from '@/store/atoms';
import { getSampleCount } from '@/utils/samples';

export const useRandomizeSamples = () => {
  const setSampleIndex1 = useSetAtom(getSampleIndexAtom(0));
  const setSampleIndex2 = useSetAtom(getSampleIndexAtom(1));
  const setSampleIndex3 = useSetAtom(getSampleIndexAtom(2));
  const setSampleIndex4 = useSetAtom(getSampleIndexAtom(3));
  const selectedKitId = useAtomValue(selectedDrumKitIdAtom);
  const hasRandomizedRef = useRef(false);

  useEffect(() => {
    if (hasRandomizedRef.current) return;

    // Only run on client side after hydration
    if (typeof window !== 'undefined') {
      hasRandomizedRef.current = true;
      // Randomize each track's sample
      setSampleIndex1(Math.floor(Math.random() * getSampleCount(selectedKitId, 'kick')));
      setSampleIndex2(Math.floor(Math.random() * getSampleCount(selectedKitId, 'snare')));
      setSampleIndex3(Math.floor(Math.random() * getSampleCount(selectedKitId, 'hat')));
      setSampleIndex4(Math.floor(Math.random() * getSampleCount(selectedKitId, 'tom')));
    }
  }, [selectedKitId, setSampleIndex1, setSampleIndex2, setSampleIndex3, setSampleIndex4]);
};
