'use client'

import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { getParticleCountAtom } from '@/store/atoms';

export const useRandomizeParticleCounts = () => {
  const setParticleCount1 = useSetAtom(getParticleCountAtom(0));
  const setParticleCount2 = useSetAtom(getParticleCountAtom(1));
  const setParticleCount3 = useSetAtom(getParticleCountAtom(2));
  const setParticleCount4 = useSetAtom(getParticleCountAtom(3));

  useEffect(() => {
    // Only run on client side after hydration
    if (typeof window !== 'undefined') {
      // Randomize each track's particle count (0-1)
      setParticleCount1(Math.floor(Math.random() * 2));
      setParticleCount2(Math.floor(Math.random() * 2));
      setParticleCount3(Math.floor(Math.random() * 2));
      setParticleCount4(Math.floor(Math.random() * 2));
    }
  }, []); // Run once on mount
}; 