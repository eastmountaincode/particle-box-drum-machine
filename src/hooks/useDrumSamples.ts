'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import * as Tone from 'tone';
import { getSampleIndexAtom, getLightingAtom, reverbWetAtom, reverbDecayAtom, reverbRoomSizeAtom, globalVolumeAtom, getTrackVolumeAtom } from '@/store/atoms';
import { getInstrumentForTrack, getSampleName, getSamplePath } from '@/utils/samples';

interface UseDrumSamplesReturn {
  playSample: (velocity?: number) => void;
  isLoaded: boolean;
}

export const useDrumSamples = (trackIndex: number): UseDrumSamplesReturn => {
  const sampleIndex = useAtomValue(getSampleIndexAtom(trackIndex));
  const lightingEnabled = useAtomValue(getLightingAtom(trackIndex));
  const reverbWet = useAtomValue(reverbWetAtom);
  const reverbDecay = useAtomValue(reverbDecayAtom);
  const reverbRoomSize = useAtomValue(reverbRoomSizeAtom);
  const globalVolume = useAtomValue(globalVolumeAtom);
  const trackVolume = useAtomValue(getTrackVolumeAtom(trackIndex));
  const playerRef = useRef<Tone.Player | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const isLoadedRef = useRef(false);
  const currentSampleRef = useRef<string>('');

  // Get current sample info
  const instrument = getInstrumentForTrack(trackIndex);
  const sampleName = getSampleName(instrument, sampleIndex);
  const samplePath = getSamplePath(instrument, sampleName);

  // Initialize reverb effect
  useEffect(() => {
    if (!reverbRef.current) {
      // Use room size to add pre-delay for spatial effect
      const preDelay = reverbRoomSize * 0.1; // 0-0.1 seconds pre-delay based on room size
      
      reverbRef.current = new Tone.Reverb({
        decay: reverbDecay,
        wet: reverbWet,
        preDelay: preDelay
      }).toDestination();
    }

    return () => {
      if (reverbRef.current) {
        reverbRef.current.dispose();
        reverbRef.current = null;
      }
    };
  }, []);

  // Update reverb parameters when they change
  useEffect(() => {
    if (reverbRef.current) {
      reverbRef.current.wet.value = reverbWet;
      reverbRef.current.decay = reverbDecay;
      
      // For room size, we'll update the pre-delay
      // Note: Pre-delay can't be changed after creation in Tone.js, so we recreate the reverb
      reverbRef.current.dispose();
      
      const preDelay = reverbRoomSize * 0.1;
      reverbRef.current = new Tone.Reverb({
        decay: reverbDecay,
        wet: reverbWet,
        preDelay: preDelay
      }).toDestination();

      // Reconnect the player if it exists
      if (playerRef.current && lightingEnabled) {
        playerRef.current.disconnect();
        playerRef.current.connect(reverbRef.current);
      }
    }
  }, [reverbWet, reverbDecay, reverbRoomSize, lightingEnabled]);

  // Load sample when it changes
  useEffect(() => {
    const loadSample = async () => {
      // Don't reload if it's the same sample
      if (currentSampleRef.current === samplePath) return;

      // Dispose of existing player
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }

      isLoadedRef.current = false;
      currentSampleRef.current = samplePath;

      try {
        // Create new player with the sample
        playerRef.current = new Tone.Player({
          url: samplePath,
          onload: () => {
            isLoadedRef.current = true;
          },
          onerror: (error) => {
            console.error(`Failed to load sample ${samplePath}:`, error);
            isLoadedRef.current = false;
          }
        });

        // Connect to destination (we'll handle routing in the lighting effect)
        playerRef.current.toDestination();

      } catch (error) {
        console.error(`Error creating player for ${samplePath}:`, error);
        isLoadedRef.current = false;
      }
    };

    loadSample();

    // Cleanup on unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      isLoadedRef.current = false;
    };
  }, [samplePath]);

  // Update audio routing based on lighting state
  useEffect(() => {
    if (playerRef.current && reverbRef.current) {
      // Disconnect all existing connections
      playerRef.current.disconnect();
      
      if (lightingEnabled) {
        // Route through reverb when lighting is on
        playerRef.current.connect(reverbRef.current);
      } else {
        // Direct to destination when lighting is off
        playerRef.current.toDestination();
      }
    }
  }, [lightingEnabled]);

  const playSample = useCallback((velocity: number = 1) => {
    if (playerRef.current && isLoadedRef.current) {
      try {
        // Stop any currently playing instance
        if (playerRef.current.state === 'started') {
          playerRef.current.stop();
        }
        
        // Play the sample with velocity, global volume, and per-track volume control
        const finalVolume = velocity * globalVolume * trackVolume;
        playerRef.current.volume.value = Tone.gainToDb(finalVolume);
        playerRef.current.start();
      } catch (error) {
        console.error('Error playing sample:', error);
      }
    }
  }, [samplePath, globalVolume, trackVolume]);

  return {
    playSample,
    isLoaded: isLoadedRef.current
  };
}; 