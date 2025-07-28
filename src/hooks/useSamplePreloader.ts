'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { 
  InstrumentType, 
  INSTRUMENT_TYPES, 
  SAMPLE_DATA, 
  getSamplePath, 
  getSampleKey, 
  getTotalSampleCount 
} from '@/utils/samples';

// Sample cache entry interface
interface SampleCacheEntry {
  player: Tone.Player;
  loaded: boolean;
  error?: Error;
}

// Sample cache type
type SampleCache = Map<string, SampleCacheEntry>;

// Loading state interface
interface LoadingState {
  totalSamples: number;
  loadedSamples: number;
  failedSamples: number;
  progress: number;
}

// Hook return interface
interface UseSamplePreloaderReturn {
  getPlayer: (instrument: InstrumentType, sampleIndex: number) => Tone.Player | null;
  isLoaded: (instrument: InstrumentType, sampleIndex: number) => boolean;
  loadingProgress: number;
  allSamplesLoaded: boolean;
  loadingState: LoadingState;
}

// Singleton state to ensure only one instance across the app
let globalSampleCache: SampleCache | null = null;
let globalLoadingState: LoadingState = {
  totalSamples: 0,
  loadedSamples: 0,
  failedSamples: 0,
  progress: 0
};
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Global sample preloader hook with singleton pattern
 * Preloads all drum samples at initialization and provides access to preloaded Player instances
 */
export const useSamplePreloader = (): UseSamplePreloaderReturn => {
  const [loadingState, setLoadingState] = useState<LoadingState>(globalLoadingState);
  const mountedRef = useRef(true);

  // Update loading state helper
  const updateLoadingState = useCallback((newState: Partial<LoadingState>) => {
    globalLoadingState = {
      ...globalLoadingState,
      ...newState,
      progress: globalLoadingState.totalSamples > 0 
        ? (globalLoadingState.loadedSamples + globalLoadingState.failedSamples) / globalLoadingState.totalSamples 
        : 0
    };
    
    if (mountedRef.current) {
      setLoadingState({ ...globalLoadingState });
    }
  }, []);

  // Initialize sample cache and preload all samples
  const initializeSampleCache = useCallback(async (): Promise<void> => {
    if (isInitialized || initializationPromise) {
      return initializationPromise || Promise.resolve();
    }

    console.log('Initializing sample preloader...');
    isInitialized = true;
    globalSampleCache = new Map();
    
    const totalSamples = getTotalSampleCount();
    updateLoadingState({
      totalSamples,
      loadedSamples: 0,
      failedSamples: 0,
      progress: 0
    });

    // Create promise for initialization
    initializationPromise = new Promise<void>((resolve) => {
      let completedSamples = 0;
      
      const checkCompletion = () => {
        completedSamples++;
        if (completedSamples >= totalSamples) {
          console.log(`Sample preloader initialization complete. Loaded: ${globalLoadingState.loadedSamples}, Failed: ${globalLoadingState.failedSamples}`);
          resolve();
        }
      };

      // Preload all samples for all instruments
      INSTRUMENT_TYPES.forEach(instrument => {
        SAMPLE_DATA[instrument].forEach((sampleName, sampleIndex) => {
          const samplePath = getSamplePath(instrument, sampleName);
          const sampleKey = getSampleKey(instrument, sampleIndex);

          try {
            const player = new Tone.Player({
              url: samplePath,
              onload: () => {
                if (globalSampleCache && globalSampleCache.has(sampleKey)) {
                  const entry = globalSampleCache.get(sampleKey)!;
                  entry.loaded = true;
                  
                  updateLoadingState({
                    loadedSamples: globalLoadingState.loadedSamples + 1
                  });
                }
                checkCompletion();
              },
              onerror: (error) => {
                console.error(`Failed to load sample ${samplePath}:`, error);
                
                if (globalSampleCache && globalSampleCache.has(sampleKey)) {
                  const entry = globalSampleCache.get(sampleKey)!;
                  entry.error = error instanceof Error ? error : new Error(String(error));
                  
                  updateLoadingState({
                    failedSamples: globalLoadingState.failedSamples + 1
                  });
                }
                checkCompletion();
              }
            });

            // Store in cache
            if (globalSampleCache) {
              globalSampleCache.set(sampleKey, {
                player,
                loaded: false
              });
            }

          } catch (error) {
            console.error(`Error creating player for ${samplePath}:`, error);
            updateLoadingState({
              failedSamples: globalLoadingState.failedSamples + 1
            });
            checkCompletion();
          }
        });
      });
    });

    return initializationPromise;
  }, [updateLoadingState]);

  // Initialize on first mount
  useEffect(() => {
    mountedRef.current = true;
    
    if (!isInitialized) {
      initializeSampleCache();
    } else {
      // If already initialized, just update the local state
      setLoadingState({ ...globalLoadingState });
    }

    return () => {
      mountedRef.current = false;
    };
  }, [initializeSampleCache]);

  // Cleanup function to dispose all preloaded samples
  useEffect(() => {
    return () => {
      // Only dispose if this is the last component using the preloader
      // In a real app, you might want to implement reference counting
      // For now, we'll dispose on app unmount (handled by the main component)
    };
  }, []);

  // Get preloaded player instance
  const getPlayer = useCallback((instrument: InstrumentType, sampleIndex: number): Tone.Player | null => {
    if (!globalSampleCache) {
      console.warn('Sample cache not initialized');
      return null;
    }

    // Validate input parameters
    if (!INSTRUMENT_TYPES.includes(instrument)) {
      console.warn(`Invalid instrument type: ${instrument}`);
      return null;
    }

    if (sampleIndex < 0 || sampleIndex >= SAMPLE_DATA[instrument].length) {
      console.warn(`Invalid sample index ${sampleIndex} for instrument ${instrument}`);
      return null;
    }

    const sampleKey = getSampleKey(instrument, sampleIndex);
    const cacheEntry = globalSampleCache.get(sampleKey);
    
    if (!cacheEntry) {
      console.warn(`Sample not found in cache: ${sampleKey}`);
      return null;
    }

    if (cacheEntry.error) {
      console.warn(`Sample failed to load: ${sampleKey}`, cacheEntry.error);
      // Try to return the first sample of the same instrument as fallback
      const fallbackKey = getSampleKey(instrument, 0);
      const fallbackEntry = globalSampleCache.get(fallbackKey);
      if (fallbackEntry && !fallbackEntry.error) {
        return fallbackEntry.player;
      }
      return null;
    }

    return cacheEntry.player;
  }, []);

  // Check if a specific sample is loaded
  const isLoaded = useCallback((instrument: InstrumentType, sampleIndex: number): boolean => {
    if (!globalSampleCache) {
      return false;
    }

    // Validate input parameters
    if (!INSTRUMENT_TYPES.includes(instrument)) {
      return false;
    }

    if (sampleIndex < 0 || sampleIndex >= SAMPLE_DATA[instrument].length) {
      return false;
    }

    const sampleKey = getSampleKey(instrument, sampleIndex);
    const cacheEntry = globalSampleCache.get(sampleKey);
    
    return cacheEntry?.loaded || false;
  }, []);

  return {
    getPlayer,
    isLoaded,
    loadingProgress: loadingState.progress,
    allSamplesLoaded: loadingState.progress >= 1,
    loadingState
  };
};

/**
 * Utility function to dispose all preloaded samples
 * Should be called on application unmount
 */
export const disposeSamplePreloader = (): void => {
  if (globalSampleCache) {
    globalSampleCache.forEach((entry) => {
      try {
        entry.player.dispose();
      } catch (error) {
        console.error('Error disposing sample player:', error);
      }
    });
    
    globalSampleCache.clear();
    globalSampleCache = null;
  }
  
  isInitialized = false;
  initializationPromise = null;
  globalLoadingState = {
    totalSamples: 0,
    loadedSamples: 0,
    failedSamples: 0,
    progress: 0
  };
};