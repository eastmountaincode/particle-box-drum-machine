'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import * as Tone from 'tone';
import {
  DRUM_KITS,
  getAllKitSampleRefs,
  getSample,
  getSampleKey,
  type DrumKitId,
  type InstrumentType,
} from '@/utils/samples';

export type KitLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface KitLoadingState {
  status: KitLoadStatus;
  totalSamples: number;
  loadedSamples: number;
  failedSamples: number;
  progress: number;
  error: string | null;
}

interface UseSamplePreloaderReturn {
  preloadKit: (kitId: DrumKitId) => Promise<void>;
  getBuffer: (
    kitId: DrumKitId,
    instrument: InstrumentType,
    sampleIndex: number
  ) => Tone.ToneAudioBuffer | null;
  isLoaded: (
    kitId: DrumKitId,
    instrument: InstrumentType,
    sampleIndex: number
  ) => boolean;
  getKitLoadingState: (kitId: DrumKitId) => KitLoadingState;
  cacheVersion: number;
}

interface SampleWatch {
  instrument: InstrumentType;
  sampleIndex: number;
}

const EMPTY_KIT_STATE: KitLoadingState = {
  status: 'idle',
  totalSamples: 0,
  loadedSamples: 0,
  failedSamples: 0,
  progress: 0,
  error: null,
};

const sampleBufferCache = new Map<string, Tone.ToneAudioBuffer>();
const sampleLoadingPromises = new Map<string, Promise<Tone.ToneAudioBuffer | null>>();
const kitLoadingStates = new Map<DrumKitId, KitLoadingState>();
const kitLoadingPromises = new Map<DrumKitId, Promise<void>>();
const listeners = new Set<() => void>();
const sampleListeners = new Map<string, Set<() => void>>();
const sampleVersions = new Map<string, number>();

let storeVersion = 0;
let cacheGeneration = 0;

const KIT_PRELOAD_CONCURRENCY = 4;

const notify = () => {
  storeVersion += 1;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => storeVersion;
const getServerSnapshot = () => 0;

const notifySample = (sampleKey: string) => {
  sampleVersions.set(sampleKey, (sampleVersions.get(sampleKey) ?? 0) + 1);
  sampleListeners.get(sampleKey)?.forEach((listener) => listener());
};

const setKitLoadingState = (kitId: DrumKitId, state: KitLoadingState) => {
  kitLoadingStates.set(kitId, state);
  notify();
};

export const getKitLoadingState = (kitId: DrumKitId): KitLoadingState => (
  kitLoadingStates.get(kitId) ?? EMPTY_KIT_STATE
);

export const getPreloadedSampleBuffer = (
  kitId: DrumKitId,
  instrument: InstrumentType,
  sampleIndex: number
): Tone.ToneAudioBuffer | null => (
  sampleBufferCache.get(getSampleKey(kitId, instrument, sampleIndex)) ?? null
);

export const isSampleBufferLoaded = (
  kitId: DrumKitId,
  instrument: InstrumentType,
  sampleIndex: number
): boolean => sampleBufferCache.has(getSampleKey(kitId, instrument, sampleIndex));

const loadSampleBuffer = (
  kitId: DrumKitId,
  instrument: InstrumentType,
  sampleIndex: number,
  path: string
): Promise<Tone.ToneAudioBuffer | null> => {
  const sampleKey = getSampleKey(kitId, instrument, sampleIndex);
  const cachedBuffer = sampleBufferCache.get(sampleKey);
  if (cachedBuffer) return Promise.resolve(cachedBuffer);

  const existingPromise = sampleLoadingPromises.get(sampleKey);
  if (existingPromise) return existingPromise;

  const generation = cacheGeneration;
  const loadPromise = Tone.ToneAudioBuffer.fromUrl(path).then((buffer) => {
    if (generation !== cacheGeneration) {
      buffer.dispose();
      return null;
    }

    sampleBufferCache.set(sampleKey, buffer);
    notifySample(sampleKey);
    return buffer;
  });

  sampleLoadingPromises.set(sampleKey, loadPromise);
  const clearPromise = () => {
    if (sampleLoadingPromises.get(sampleKey) === loadPromise) {
      sampleLoadingPromises.delete(sampleKey);
    }
  };
  void loadPromise.then(clearPromise, clearPromise);
  return loadPromise;
};

export const preloadSampleBuffer = (
  kitId: DrumKitId,
  instrument: InstrumentType,
  sampleIndex: number
): Promise<Tone.ToneAudioBuffer | null> => {
  const sample = getSample(kitId, instrument, sampleIndex);
  return loadSampleBuffer(kitId, instrument, sample.index, sample.path);
};

export const preloadKitSamples = (kitId: DrumKitId): Promise<void> => {
  if (getKitLoadingState(kitId).status === 'ready') {
    return Promise.resolve();
  }

  const existingPromise = kitLoadingPromises.get(kitId);
  if (existingPromise) return existingPromise;

  const generation = cacheGeneration;
  const samples = getAllKitSampleRefs(kitId);
  const samplesToLoad = samples.filter(({ instrument, index }) => (
    !sampleBufferCache.has(getSampleKey(kitId, instrument, index))
  ));
  const alreadyLoaded = samples.length - samplesToLoad.length;

  setKitLoadingState(kitId, {
    status: 'loading',
    totalSamples: samples.length,
    loadedSamples: alreadyLoaded,
    failedSamples: 0,
    progress: samples.length === 0 ? 1 : alreadyLoaded / samples.length,
    error: null,
  });

  const loadPromise = (async () => {
    const results: PromiseSettledResult<void>[] = new Array(samplesToLoad.length);
    let nextSampleIndex = 0;

    const loadNextSample = async () => {
      while (nextSampleIndex < samplesToLoad.length) {
        const resultIndex = nextSampleIndex;
        nextSampleIndex += 1;
        const { instrument, index, sample } = samplesToLoad[resultIndex];

        try {
          await loadSampleBuffer(kitId, instrument, index, sample.path);
          if (generation !== cacheGeneration) return;

          const currentState = getKitLoadingState(kitId);
          const loadedSamples = currentState.loadedSamples + 1;
          setKitLoadingState(kitId, {
            ...currentState,
            loadedSamples,
            progress: currentState.totalSamples === 0
              ? 1
              : (loadedSamples + currentState.failedSamples) / currentState.totalSamples,
          });
          results[resultIndex] = { status: 'fulfilled', value: undefined };
        } catch (error) {
          if (generation !== cacheGeneration) return;

          const currentState = getKitLoadingState(kitId);
          const failedSamples = currentState.failedSamples + 1;
          setKitLoadingState(kitId, {
            ...currentState,
            failedSamples,
            progress: currentState.totalSamples === 0
              ? 1
              : (currentState.loadedSamples + failedSamples) / currentState.totalSamples,
          });
          results[resultIndex] = { status: 'rejected', reason: error };
        }
      }
    };

    await Promise.all(
      Array.from(
        { length: Math.min(KIT_PRELOAD_CONCURRENCY, samplesToLoad.length) },
        () => loadNextSample()
      )
    );

    if (generation !== cacheGeneration) return;

    const failureCount = results.filter((result) => result.status === 'rejected').length;
    if (failureCount > 0) {
      const message = `Failed to load ${failureCount} sample${failureCount === 1 ? '' : 's'} from ${DRUM_KITS[kitId].name}.`;
      const currentState = getKitLoadingState(kitId);
      setKitLoadingState(kitId, {
        ...currentState,
        status: 'error',
        error: message,
      });
      throw new Error(message);
    }

    setKitLoadingState(kitId, {
      status: 'ready',
      totalSamples: samples.length,
      loadedSamples: samples.length,
      failedSamples: 0,
      progress: 1,
      error: null,
    });
  })();

  kitLoadingPromises.set(kitId, loadPromise);
  void loadPromise.finally(() => {
    if (kitLoadingPromises.get(kitId) === loadPromise) {
      kitLoadingPromises.delete(kitId);
    }
  }).catch(() => {
    // The caller receives the original rejection. This only handles the
    // promise returned by finally so it does not become unhandled.
  });

  return loadPromise;
};

export const useSamplePreloader = (
  activeKitId?: DrumKitId,
  watchSample?: SampleWatch
): UseSamplePreloaderReturn => {
  const watchedInstrument = watchSample?.instrument;
  const watchedSampleIndex = watchSample?.sampleIndex;
  const watchedSampleKey = activeKitId && watchedInstrument !== undefined && watchedSampleIndex !== undefined
    ? getSampleKey(activeKitId, watchedInstrument, watchedSampleIndex)
    : null;
  const subscribeToStore = useCallback((listener: () => void) => {
    if (!watchedSampleKey) return subscribe(listener);

    const keyListeners = sampleListeners.get(watchedSampleKey) ?? new Set<() => void>();
    keyListeners.add(listener);
    sampleListeners.set(watchedSampleKey, keyListeners);

    return () => {
      keyListeners.delete(listener);
      if (keyListeners.size === 0) sampleListeners.delete(watchedSampleKey);
    };
  }, [watchedSampleKey]);
  const getStoreSnapshot = useCallback(() => (
    watchedSampleKey ? sampleVersions.get(watchedSampleKey) ?? 0 : getSnapshot()
  ), [watchedSampleKey]);
  const cacheVersion = useSyncExternalStore(subscribeToStore, getStoreSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!activeKitId) return;

    // Get the currently selected voice ready first. The rest of the kit starts
    // on the next task and is capped at four concurrent fetch/decode jobs.
    if (watchedInstrument !== undefined && watchedSampleIndex !== undefined) {
      void preloadSampleBuffer(
        activeKitId,
        watchedInstrument,
        watchedSampleIndex
      ).catch((error) => {
        console.error(`Could not preload selected sample from ${activeKitId}:`, error);
      });
    }

    const preloadTimer = setTimeout(() => {
      void preloadKitSamples(activeKitId).catch((error) => {
        console.error(`Could not preload drum kit ${activeKitId}:`, error);
      });
    }, 0);

    return () => clearTimeout(preloadTimer);
  }, [activeKitId, watchedInstrument, watchedSampleIndex]);

  return {
    preloadKit: preloadKitSamples,
    getBuffer: getPreloadedSampleBuffer,
    isLoaded: isSampleBufferLoaded,
    getKitLoadingState,
    cacheVersion,
  };
};

export const disposeSamplePreloader = (): void => {
  cacheGeneration += 1;
  sampleBufferCache.forEach((buffer) => buffer.dispose());
  sampleBufferCache.clear();
  sampleLoadingPromises.clear();
  kitLoadingStates.clear();
  kitLoadingPromises.clear();
  sampleVersions.clear();
  sampleListeners.forEach((keyListeners) => keyListeners.forEach((listener) => listener()));
  notify();
};
