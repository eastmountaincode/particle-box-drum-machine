'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import * as Tone from 'tone';
import { getSampleIndexAtom } from '@/store/atoms';
import { getInstrumentForTrack, getSampleName, getSamplePath } from '@/utils/samples';

interface UseDrumSamplesReturn {
  playSample: (velocity?: number) => void;
  isLoaded: boolean;
}

export const useDrumSamples = (trackIndex: number): UseDrumSamplesReturn => {
  const sampleIndex = useAtomValue(getSampleIndexAtom(trackIndex));
  const playerRef = useRef<Tone.Player | null>(null);
  const isLoadedRef = useRef(false);
  const currentSampleRef = useRef<string>('');

  // Get current sample info
  const instrument = getInstrumentForTrack(trackIndex);
  const sampleName = getSampleName(instrument, sampleIndex);
  const samplePath = getSamplePath(instrument, sampleName);

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
        }).toDestination();

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

  const playSample = useCallback((velocity: number = 1) => {
    if (playerRef.current && isLoadedRef.current) {
      try {
        // Stop any currently playing instance
        if (playerRef.current.state === 'started') {
          playerRef.current.stop();
        }
        
        // Play the sample with velocity control
        playerRef.current.volume.value = Tone.gainToDb(velocity);
        playerRef.current.start();
      } catch (error) {
        console.error('Error playing sample:', error);
      }
    }
  }, [samplePath]);

  return {
    playSample,
    isLoaded: isLoadedRef.current
  };
}; 