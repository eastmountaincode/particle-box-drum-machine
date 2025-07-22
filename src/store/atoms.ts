import { atom } from 'jotai';

// Particle count atoms for each track (1-4)
export const particleCount1Atom = atom(3);
export const particleCount2Atom = atom(3);
export const particleCount3Atom = atom(3);
export const particleCount4Atom = atom(3);

// Lighting state atoms for each track (1-4)
export const lighting1Atom = atom(false);
export const lighting2Atom = atom(false);
export const lighting3Atom = atom(false);
export const lighting4Atom = atom(false);

// Background color atom
export const backgroundColorAtom = atom('#ff0000');

// Current sequencer step atom
export const currentStepAtom = atom(0);

// Helper function to get atoms by index
export const getParticleCountAtom = (index: number) => {
  switch (index) {
    case 0: return particleCount1Atom;
    case 1: return particleCount2Atom;
    case 2: return particleCount3Atom;
    case 3: return particleCount4Atom;
    default: throw new Error(`Invalid track index: ${index}`);
  }
};

export const getLightingAtom = (index: number) => {
  switch (index) {
    case 0: return lighting1Atom;
    case 1: return lighting2Atom;
    case 2: return lighting3Atom;
    case 3: return lighting4Atom;
    default: throw new Error(`Invalid track index: ${index}`);
  }
}; 