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
  const dryGainRef = useRef<Tone.Gain | null>(null);
  const wetGainRef = useRef<Tone.Gain | null>(null);
  const isLoadedRef = useRef(false);
  const currentSampleRef = useRef<string>('');

  // Get current sample info
  const instrument = getInstrumentForTrack(trackIndex);
  const sampleName = getSampleName(instrument, sampleIndex);
  const samplePath = getSamplePath(instrument, sampleName);

  // Audio routing function - control dry/wet mix with gain levels
  const updateAudioRouting = useCallback(() => {
    if (dryGainRef.current && wetGainRef.current) {
      if (lightingEnabled) {
        // Reverb on: dry signal off, wet signal on
        dryGainRef.current.gain.value = 0;
        wetGainRef.current.gain.value = 1;
      } else {
        // Reverb off: dry signal on, wet signal off  
        dryGainRef.current.gain.value = 1;
        wetGainRef.current.gain.value = 0;
      }
    }
  }, [lightingEnabled]);

  // Initialize audio routing with separate dry/wet paths
  useEffect(() => {
    // Clean up existing nodes
    if (reverbRef.current) {
      reverbRef.current.dispose();
      reverbRef.current = null;
    }
    if (dryGainRef.current) {
      dryGainRef.current.dispose();
      dryGainRef.current = null;
    }
    if (wetGainRef.current) {
      wetGainRef.current.dispose();
      wetGainRef.current = null;
    }

    // Create dry path (direct to destination)
    dryGainRef.current = new Tone.Gain(lightingEnabled ? 0 : 1).toDestination();
    
    // Create wet path (through reverb to destination)  
    wetGainRef.current = new Tone.Gain(lightingEnabled ? 1 : 0).toDestination();
    
    // Create reverb with current settings
    const preDelay = reverbRoomSize * 0.1;
    reverbRef.current = new Tone.Reverb({
      decay: reverbDecay,
      wet: reverbWet,
      preDelay: preDelay
    });
    reverbRef.current.connect(wetGainRef.current);

    // Reconnect player if it exists
    if (playerRef.current) {
      playerRef.current.disconnect();
      playerRef.current.connect(dryGainRef.current);
      playerRef.current.connect(reverbRef.current);
    }

    return () => {
      if (reverbRef.current) {
        reverbRef.current.dispose();
        reverbRef.current = null;
      }
      if (dryGainRef.current) {
        dryGainRef.current.dispose();
        dryGainRef.current = null;
      }
      if (wetGainRef.current) {
        wetGainRef.current.dispose();
        wetGainRef.current = null;
      }
    };
  }, [lightingEnabled, reverbWet, reverbDecay, reverbRoomSize]);

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

        // Connect to both dry and wet paths: player splits to dry gain and reverb
        if (dryGainRef.current && reverbRef.current) {
          playerRef.current.connect(dryGainRef.current);
          playerRef.current.connect(reverbRef.current);
        }

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
        
        // Play the sample with velocity, global volume, and per-track volume control
        const finalVolume = velocity * globalVolume * trackVolume;
        playerRef.current.volume.value = Tone.gainToDb(finalVolume);
        playerRef.current.start();
      } catch (error) {
        console.error('Error playing sample:', error);
      }
    }
  }, [globalVolume, trackVolume]);

  return {
    playSample,
    isLoaded: isLoadedRef.current
  };
}; 