'use client'

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { getSampleIndexAtom } from '@/store/atoms';
import { SAMPLE_DATA, INSTRUMENT_TYPES } from '@/utils/samples';

export const useRandomizeSamples = () => {
  const setSampleIndex1 = useSetAtom(getSampleIndexAtom(0));
  const setSampleIndex2 = useSetAtom(getSampleIndexAtom(1));
  const setSampleIndex3 = useSetAtom(getSampleIndexAtom(2));
  const setSampleIndex4 = useSetAtom(getSampleIndexAtom(3));

  useEffect(() => {
    // Only run on client side after hydration
    if (typeof window !== 'undefined') {
      // Randomize each track's sample
      setSampleIndex1(Math.floor(Math.random() * SAMPLE_DATA.kick.length));
      setSampleIndex2(Math.floor(Math.random() * SAMPLE_DATA.snare.length));
      setSampleIndex3(Math.floor(Math.random() * SAMPLE_DATA.hat.length));
      setSampleIndex4(Math.floor(Math.random() * SAMPLE_DATA.tom.length));
    }
  }, []); // Run once on mount
};