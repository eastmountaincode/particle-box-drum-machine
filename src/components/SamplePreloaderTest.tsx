'use client';

import React from 'react';
import { useSamplePreloader } from '@/hooks/useSamplePreloader';

/**
 * Test component to verify the sample preloader hook works correctly
 * This component can be temporarily added to the main page for testing
 */
export const SamplePreloaderTest: React.FC = () => {
  const { 
    getPlayer, 
    isLoaded, 
    loadingProgress, 
    allSamplesLoaded, 
    loadingState 
  } = useSamplePreloader();

  const testSample = () => {
    const player = getPlayer('kick', 0);
    if (player && isLoaded('kick', 0)) {
      console.log('Playing test sample...');
      player.start();
    } else {
      console.log('Sample not ready yet');
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-2">Sample Preloader Test</h3>
      
      <div className="mb-4">
        <div className="text-sm">
          Loading Progress: {Math.round(loadingProgress * 100)}%
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${loadingProgress * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        <div>Total Samples: {loadingState.totalSamples}</div>
        <div>Loaded: {loadingState.loadedSamples}</div>
        <div>Failed: {loadingState.failedSamples}</div>
        <div>All Loaded: {allSamplesLoaded ? 'Yes' : 'No'}</div>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold mb-2">Sample Status Check:</h4>
        <div className="grid grid-cols-4 gap-2 text-xs">
          {(['kick', 'snare', 'hat', 'tom'] as const).map((instrument) => (
            <div key={instrument}>
              <div className="font-medium">{instrument}:</div>
              <div>Sample 0: {isLoaded(instrument, 0) ? '✓' : '⏳'}</div>
              <div>Player: {getPlayer(instrument, 0) ? '✓' : '✗'}</div>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={testSample}
        disabled={!allSamplesLoaded}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
      >
        Test Play Kick Sample
      </button>
    </div>
  );
};