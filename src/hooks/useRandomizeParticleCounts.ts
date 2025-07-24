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
      // Generate random particle counts (0-2) for each track
      const counts = [
        Math.floor(Math.random() * 3),
        Math.floor(Math.random() * 3),
        Math.floor(Math.random() * 3),
        Math.floor(Math.random() * 3)
      ];

      // Count how many boxes have at least 1 particle
      const boxesWithParticles = counts.filter(count => count >= 1).length;

      // If fewer than 2 boxes have particles, ensure at least 2 do
      if (boxesWithParticles < 2) {
        const boxesWithZero = counts.map((count, index) => ({ count, index }))
          .filter(item => item.count === 0)
          .map(item => item.index);
        
        // Randomly select boxes with 0 particles and set them to at least 1
        const boxesToFix = 2 - boxesWithParticles;
        const shuffledZeroBoxes = boxesWithZero.sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < boxesToFix && i < shuffledZeroBoxes.length; i++) {
          const boxIndex = shuffledZeroBoxes[i];
          counts[boxIndex] = Math.floor(Math.random() * 2) + 1; // 1 or 2 particles
        }
      }

      // Ensure at most one box has 2 particles
      const boxesWith2Particles = counts.map((count, index) => ({ count, index }))
        .filter(item => item.count === 2)
        .map(item => item.index);

      if (boxesWith2Particles.length > 1) {
        // Keep one random box with 2 particles, reduce the rest to 1
        const shuffledBoxesWith2 = boxesWith2Particles.sort(() => Math.random() - 0.5);
        for (let i = 1; i < shuffledBoxesWith2.length; i++) {
          const boxIndex = shuffledBoxesWith2[i];
          counts[boxIndex] = 1; // Reduce to 1 particle
        }
      }

      // Apply the counts to each track
      setParticleCount1(counts[0]);
      setParticleCount2(counts[1]);
      setParticleCount3(counts[2]);
      setParticleCount4(counts[3]);
    }
  }, []); // Run once on mount
}; 