'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import * as Tone from 'tone';
import { getSampleIndexAtom, getLightingAtom, reverbWetAtom, reverbDecayAtom, reverbRoomSizeAtom, globalVolumeAtom, getTrackVolumeAtom } from '@/store/atoms';
import { getInstrumentForTrack } from '@/utils/samples';
import { useSamplePreloader } from './useSamplePreloader';

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

  // Use sample preloader to get preloaded players
  const { getPlayer, isLoaded: isSampleLoaded } = useSamplePreloader();

  const currentPlayerRef = useRef<Tone.Player | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const dryGainRef = useRef<Tone.Gain | null>(null);
  const wetGainRef = useRef<Tone.Gain | null>(null);
  const playerGainRef = useRef<Tone.Gain | null>(null); // Individual gain node for this track
  const currentSampleIndexRef = useRef<number>(-1);

  // Get current sample info
  const instrument = getInstrumentForTrack(trackIndex);



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
    if (playerGainRef.current) {
      playerGainRef.current.dispose();
      playerGainRef.current = null;
    }

    // Create individual gain node for this track (connects to shared player)
    playerGainRef.current = new Tone.Gain(1);

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

    // Connect the player gain to both dry and wet paths
    if (playerGainRef.current) {
      playerGainRef.current.connect(dryGainRef.current);
      playerGainRef.current.connect(reverbRef.current);
    }

    // Reconnect current player to the individual gain node (not directly to effects)
    if (currentPlayerRef.current && playerGainRef.current) {
      // Don't disconnect the shared player, just connect it to our individual gain
      currentPlayerRef.current.connect(playerGainRef.current);
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
      if (playerGainRef.current) {
        playerGainRef.current.dispose();
        playerGainRef.current = null;
      }
    };
  }, [lightingEnabled, reverbWet, reverbDecay, reverbRoomSize]);

  // Switch to preloaded sample when sample index changes
  useEffect(() => {
    // Don't switch if it's the same sample
    if (currentSampleIndexRef.current === sampleIndex) return;

    // Disconnect current player from our individual gain node only
    if (currentPlayerRef.current && playerGainRef.current) {
      currentPlayerRef.current.disconnect(playerGainRef.current);
      currentPlayerRef.current = null;
    }

    currentSampleIndexRef.current = sampleIndex;

    // Get preloaded player from the preloader
    const preloadedPlayer = getPlayer(instrument, sampleIndex);

    if (preloadedPlayer && playerGainRef.current) {
      currentPlayerRef.current = preloadedPlayer;

      // Connect the shared player to our individual gain node
      currentPlayerRef.current.connect(playerGainRef.current);
    } else {
      console.warn(`Failed to get preloaded player for ${instrument}:${sampleIndex}`);
    }

    // No cleanup needed since we don't own the player instances
  }, [sampleIndex, instrument, getPlayer]);

  const playSample = useCallback((velocity: number = 1) => {
    if (currentPlayerRef.current && isSampleLoaded(instrument, sampleIndex)) {
      try {
        // Stop any currently playing instance
        if (currentPlayerRef.current.state === 'started') {
          currentPlayerRef.current.stop();
        }

        // Play the sample with velocity, global volume, and per-track volume control
        const finalVolume = velocity * globalVolume * trackVolume;
        currentPlayerRef.current.volume.value = Tone.gainToDb(finalVolume);
        currentPlayerRef.current.start();
      } catch (error) {
        console.error('Error playing sample:', error);
      }
    }
  }, [currentPlayerRef, instrument, sampleIndex, isSampleLoaded, globalVolume, trackVolume]);

  return {
    playSample,
    isLoaded: isSampleLoaded(instrument, sampleIndex)
  };
}; 