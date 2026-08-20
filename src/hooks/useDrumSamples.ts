'use client';

import { useCallback, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import {
  getLightingAtom,
  getSampleIndexAtom,
  getTrackVolumeAtom,
  globalVolumeAtom,
  reverbDecayAtom,
  reverbRoomSizeAtom,
  reverbWetAtom,
  selectedDrumKitIdAtom,
} from '@/store/atoms';
import { getInstrumentForTrack, getSampleKey } from '@/utils/samples';
import { useSamplePreloader } from './useSamplePreloader';
import { drumAudioEngine } from '@/services/drumAudioEngine';

interface UseDrumSamplesReturn {
  playSample: (velocity?: number, time?: number) => void;
  isLoaded: boolean;
}

export const useDrumSamples = (trackIndex: number): UseDrumSamplesReturn => {
  const selectedKitId = useAtomValue(selectedDrumKitIdAtom);
  const sampleIndex = useAtomValue(getSampleIndexAtom(trackIndex));
  const lightingEnabled = useAtomValue(getLightingAtom(trackIndex));
  const reverbWet = useAtomValue(reverbWetAtom);
  const reverbDecay = useAtomValue(reverbDecayAtom);
  const reverbRoomSize = useAtomValue(reverbRoomSizeAtom);
  const globalVolume = useAtomValue(globalVolumeAtom);
  const trackVolume = useAtomValue(getTrackVolumeAtom(trackIndex));
  const instrument = getInstrumentForTrack(trackIndex);
  const { getBuffer, isLoaded: isSampleLoaded } = useSamplePreloader(selectedKitId, {
    instrument,
    sampleIndex,
  });

  useEffect(() => {
    drumAudioEngine.retainTrack(trackIndex);
    return () => {
      drumAudioEngine.releaseTrack(trackIndex);
    };
  }, [trackIndex]);

  useEffect(() => {
    drumAudioEngine.setTrackReverbEnabled(trackIndex, lightingEnabled);
  }, [lightingEnabled, trackIndex]);

  useEffect(() => {
    drumAudioEngine.configureReverb(reverbWet, reverbDecay, reverbRoomSize * 0.1);
  }, [reverbWet, reverbDecay, reverbRoomSize]);

  useEffect(() => {
    drumAudioEngine.setGlobalVolume(globalVolume);
  }, [globalVolume]);

  useEffect(() => {
    drumAudioEngine.setTrackVolume(trackIndex, trackVolume);
  }, [trackIndex, trackVolume]);

  const playSample = useCallback((velocity = 1, time?: number) => {
    const buffer = getBuffer(selectedKitId, instrument, sampleIndex);
    const selectionKey = getSampleKey(selectedKitId, instrument, sampleIndex);

    if (
      !buffer
      || !isSampleLoaded(selectedKitId, instrument, sampleIndex)
    ) {
      return;
    }

    try {
      drumAudioEngine.trigger(trackIndex, buffer, velocity, time);
    } catch (error) {
      console.error(`Error playing drum sample ${selectionKey}:`, error);
    }
  }, [getBuffer, instrument, isSampleLoaded, sampleIndex, selectedKitId, trackIndex]);

  return {
    playSample,
    isLoaded: isSampleLoaded(selectedKitId, instrument, sampleIndex),
  };
};
