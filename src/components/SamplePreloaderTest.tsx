'use client';

import { useAtomValue } from 'jotai';
import { selectedDrumKitIdAtom } from '@/store/atoms';
import { DRUM_KITS, INSTRUMENT_TYPES } from '@/utils/samples';
import { useSamplePreloader } from '@/hooks/useSamplePreloader';

/** Development-only status panel for checking the active kit cache. */
export const SamplePreloaderTest = () => {
  const selectedKitId = useAtomValue(selectedDrumKitIdAtom);
  const { preloadKit, isLoaded, getKitLoadingState } = useSamplePreloader(selectedKitId);
  const loadingState = getKitLoadingState(selectedKitId);

  return (
    <div className="rounded-lg bg-gray-100 p-4 text-black">
      <h3 className="mb-2 text-lg font-bold">{DRUM_KITS[selectedKitId].name} cache</h3>

      <div className="mb-4 text-sm">
        {loadingState.loadedSamples}/{loadingState.totalSamples} samples · {Math.round(loadingState.progress * 100)}%
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2 text-xs">
        {INSTRUMENT_TYPES.map((instrument) => (
          <div key={instrument}>
            <div className="font-medium">{instrument}</div>
            <div>Sample 0: {isLoaded(selectedKitId, instrument, 0) ? '✓' : '⏳'}</div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="rounded bg-blue-500 px-4 py-2 text-white disabled:bg-gray-400"
        disabled={loadingState.status === 'loading'}
        onClick={() => void preloadKit(selectedKitId).catch(console.error)}
      >
        {loadingState.status === 'error' ? 'Retry kit' : 'Load kit'}
      </button>
    </div>
  );
};
