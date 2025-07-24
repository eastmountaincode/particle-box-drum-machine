import { atom } from 'jotai';
import { SAMPLE_DATA } from '@/utils/samples';

// Global play state atom
export const isPlayingAtom = atom(false);

// Particle count atoms for each track (1-4) - will be randomized on client
export const particleCount1Atom = atom(3);
export const particleCount2Atom = atom(3);
export const particleCount3Atom = atom(3);
export const particleCount4Atom = atom(3);

// Lighting state atoms for each track (1-4)
export const lighting1Atom = atom(false);
export const lighting2Atom = atom(true);
export const lighting3Atom = atom(true);
export const lighting4Atom = atom(true);

// Quantization state atoms for each track (1-4)
export const quantization1Atom = atom(true);
export const quantization2Atom = atom(true);
export const quantization3Atom = atom(true);
export const quantization4Atom = atom(true);

// Freeze pattern atoms for each track (1-4)
export const freeze1Atom = atom(false);
export const freeze2Atom = atom(false);
export const freeze3Atom = atom(false);
export const freeze4Atom = atom(false);

// Mute atoms for each track (1-4)
export const mute1Atom = atom(false);
export const mute2Atom = atom(false);
export const mute3Atom = atom(false);
export const mute4Atom = atom(false);

// Background color atom
export const backgroundColorAtom = atom('#ff0000');

// Current sequencer step atom
export const currentStepAtom = atom(0);

// Global reverb parameters
export const reverbWetAtom = atom(0.5);
export const reverbDecayAtom = atom(2.5);
export const reverbRoomSizeAtom = atom(0.5);

// Global volume parameter
export const globalVolumeAtom = atom(0.5);

// Per-track volume atoms (1-4)
export const trackVolume1Atom = atom(0.8);
export const trackVolume2Atom = atom(0.8);
export const trackVolume3Atom = atom(0.3);
export const trackVolume4Atom = atom(0.8);

// Sequencer step atoms for each track (1-4) - 16 steps each
export const sequencerSteps1Atom = atom<boolean[]>(new Array(16).fill(false));
export const sequencerSteps2Atom = atom<boolean[]>(new Array(16).fill(false));
export const sequencerSteps3Atom = atom<boolean[]>(new Array(16).fill(false));
export const sequencerSteps4Atom = atom<boolean[]>(new Array(16).fill(false));

// Sample selection atoms for each track (1-4) - will be randomized on client
export const sampleIndex1Atom = atom(0);
export const sampleIndex2Atom = atom(0);
export const sampleIndex3Atom = atom(0);
export const sampleIndex4Atom = atom(0);

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

export const getQuantizationAtom = (index: number) => {
  switch (index) {
    case 0: return quantization1Atom;
    case 1: return quantization2Atom;
    case 2: return quantization3Atom;
    case 3: return quantization4Atom;
    default: throw new Error(`Invalid track index: ${index}`);
  }
};

export const getFreezeAtom = (index: number) => {
  switch (index) {
    case 0: return freeze1Atom;
    case 1: return freeze2Atom;
    case 2: return freeze3Atom;
    case 3: return freeze4Atom;
    default: throw new Error(`Invalid track index: ${index}`);
  }
};

export const getSampleIndexAtom = (index: number) => {
  switch (index) {
    case 0: return sampleIndex1Atom;
    case 1: return sampleIndex2Atom;
    case 2: return sampleIndex3Atom;
    case 3: return sampleIndex4Atom;
    default: throw new Error(`Invalid track index: ${index}`);
  }
};

export const getSequencerStepsAtom = (index: number) => {
  switch (index) {
    case 0: return sequencerSteps1Atom;
    case 1: return sequencerSteps2Atom;
    case 2: return sequencerSteps3Atom;
    case 3: return sequencerSteps4Atom;
    default: throw new Error(`Invalid track index: ${index}`);
  }
};

export const getMuteAtom = (index: number) => {
  switch (index) {
    case 0: return mute1Atom;
    case 1: return mute2Atom;
    case 2: return mute3Atom;
    case 3: return mute4Atom;
    default: throw new Error(`Invalid track index: ${index}`);
  }
};

export const getTrackVolumeAtom = (index: number) => {
  switch (index) {
    case 0: return trackVolume1Atom;
    case 1: return trackVolume2Atom;
    case 2: return trackVolume3Atom;
    case 3: return trackVolume4Atom;
    default: throw new Error(`Invalid track index: ${index}`);
  }
}; 