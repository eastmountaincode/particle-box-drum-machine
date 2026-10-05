'use client';

import React from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { getSampleIndexAtom, getQuantizationAtom, getFreezeAtom, getMuteAtom, getTrackVolumeAtom, getSequencerStepsAtom, selectedDrumKitIdAtom } from '@/store/atoms';
import { getInstrumentForTrack, getSampleName, getSampleCount } from '@/utils/samples';
import { InlineTooltip } from './Tutorial/InlineTooltip';
import { useTutorial } from './Tutorial/TutorialContext';

interface ControlPanelProps {
  onTrigger: () => void;
  triggerReady: boolean;
  trackNumber?: number;
  useLighting?: boolean;
  onLightingToggle?: () => void;
  particleCount?: number;
  onParticleCountChange?: (count: number) => void;
}

const MAX_PARTICLE_COUNT = 20;
const MIN_PARTICLE_COUNT = 0;

export const ControlPanel: React.FC<ControlPanelProps> = ({
  trackNumber = 1,
  useLighting = false,
  onLightingToggle,
  particleCount = 3,
  onParticleCountChange,
  onTrigger,
  triggerReady
}) => {
  const [sampleIndex, setSampleIndex] = useAtom(getSampleIndexAtom(trackNumber - 1));
  const [quantizationEnabled, setQuantizationEnabled] = useAtom(getQuantizationAtom(trackNumber - 1));
  const [freezeEnabled, setFreezeEnabled] = useAtom(getFreezeAtom(trackNumber - 1));
  const [muteEnabled, setMuteEnabled] = useAtom(getMuteAtom(trackNumber - 1));
  const [trackVolume, setTrackVolume] = useAtom(getTrackVolumeAtom(trackNumber - 1));
    const setSequencerSteps = useSetAtom(getSequencerStepsAtom(trackNumber - 1));
  const selectedKitId = useAtomValue(selectedDrumKitIdAtom);
  const instrument = getInstrumentForTrack(trackNumber - 1);
  const currentSample = getSampleName(selectedKitId, instrument, sampleIndex);
  const sampleCount = getSampleCount(selectedKitId, instrument);

  // Tutorial state
  const { isTutorialActive } = useTutorial();

  const handleParticleDecrease = () => {
    if (onParticleCountChange && particleCount > MIN_PARTICLE_COUNT) {
      onParticleCountChange(particleCount - 1);
    }
  };

  const handleParticleIncrease = () => {
    if (onParticleCountChange && particleCount < MAX_PARTICLE_COUNT) {
      onParticleCountChange(particleCount + 1);
    }
  };

  const handleSamplePrevious = () => {
    setSampleIndex(sampleIndex > 0 ? sampleIndex - 1 : sampleCount - 1);
  };

  const handleSampleNext = () => {
    setSampleIndex(sampleIndex < sampleCount - 1 ? sampleIndex + 1 : 0);
  };

  const handleQuantizationToggle = () => {
    setQuantizationEnabled(!quantizationEnabled);
  };

  const handleFreezeToggle = () => {
    setFreezeEnabled(!freezeEnabled);
  };

  const handleMuteToggle = () => {
    setMuteEnabled(!muteEnabled);
  };

    const handleClear = () => {
        setSequencerSteps((previousSteps) => previousSteps.map(() => false));
    };

  return (
    <div className="w-full h-full bg-black border border-white border-opacity-50 p-2 flex gap-2 select-none relative">
      {/* Main controls column */}
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex-1 flex gap-2 min-h-0">
        {/* Mute button */}
        <button
          onClick={handleMuteToggle}
          className={`flex-1 text-xs px-1 whitespace-nowrap border border-white border-opacity-50 cursor-pointer ${muteEnabled
            ? 'bg-white text-black'
            : 'bg-black text-white hover:bg-white hover:text-black'
            }`}
        >
          MUTE {muteEnabled ? 'ON' : 'OFF'}
        </button>

        {/* Freeze pattern button */}
        <button
          onClick={handleFreezeToggle}
          className={`flex-1 text-xs px-1 whitespace-nowrap border border-white border-opacity-50 cursor-pointer ${freezeEnabled
            ? 'bg-white text-black'
            : 'bg-black text-white hover:bg-white hover:text-black'
            }`}
          data-tutorial={`freeze-button-${trackNumber - 1}`}
        >
          FREEZE {freezeEnabled ? 'ON' : 'OFF'}
        </button>

        </div>

        <div className="flex-1 flex gap-2 min-h-0">
            <button
                type="button"
                aria-label={`Clear recorded steps for track ${trackNumber}`}
                data-testid={`track-clear-${trackNumber - 1}`}
                title="Clear this track's recorded steps. With FREEZE off, particles continue generating new steps."
                onClick={handleClear}
                className="flex-1 text-xs border border-white cursor-pointer bg-black text-white hover:bg-white hover:text-black active:bg-red-600 active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
                CLEAR
            </button>
            <button
                type="button"
                aria-label={`Trigger track ${trackNumber}`}
                data-testid={`track-trigger-${trackNumber - 1}`}
                disabled={!triggerReady}
                title="Play a hit. With playback, FREEZE and Q on, add it to the nearest step."
                onPointerDown={(event) => {
                    if (!triggerReady || event.button !== 0) return;
                    event.preventDefault();
                    event.currentTarget.focus();
                    onTrigger();
                }}
                onKeyDown={(event) => {
                    if (event.key !== ' ' && event.key !== 'Enter') return;
                    event.preventDefault();
                    if (!event.repeat) onTrigger();
                }}
                onKeyUp={(event) => {
                    if (event.key === ' ' || event.key === 'Enter') event.preventDefault();
                }}
                onClick={(event) => {
                    // Assistive technologies invoke click without pointer/key events.
                    if (event.detail === 0) onTrigger();
                }}
                className="flex-1 text-xs border border-white cursor-pointer touch-none bg-black text-white hover:bg-white hover:text-black active:bg-red-600 active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-40 disabled:cursor-wait"
            >
                TRIGGER
            </button>
        </div>

        {/* Particle count control row */}
        <div className="flex-1 flex items-center border border-white border-opacity-50" data-tutorial={`particle-count-${trackNumber - 1}`}>
          <button
            onClick={handleParticleDecrease}
            className="flex-1 h-full bg-black hover:bg-white hover:text-black text-white text-xs border-r border-white border-opacity-50 cursor-pointer"
            disabled={particleCount <= MIN_PARTICLE_COUNT}
          >
            -
          </button>
          <div className="flex-1 h-full bg-black text-white text-xs flex items-center justify-center border-r border-white border-opacity-50">
            {particleCount}
          </div>
          <button
            onClick={handleParticleIncrease}
            className="flex-1 h-full bg-black hover:bg-white hover:text-black text-white text-xs cursor-pointer"
            disabled={particleCount >= MAX_PARTICLE_COUNT}
          >
            +
          </button>
        </div>

        {/* Sample selection control */}
        <div className="flex-1 flex flex-col border border-white border-opacity-50" data-tutorial={`sample-selector-${trackNumber - 1}`}>
          <div className="flex-1 flex items-center">
            <button
              onClick={handleSamplePrevious}
              className="flex-1 h-full bg-black hover:bg-white hover:text-black text-white text-xs border-r border-white border-opacity-50 cursor-pointer"
            >
              ←
            </button>
            <div className="flex-2 h-full bg-black text-white text-xs flex items-center justify-center border-r border-white border-opacity-50 px-1">
              <span className="truncate text-center">{currentSample}</span>
            </div>
            <button
              onClick={handleSampleNext}
              className="flex-1 h-full bg-black hover:bg-white hover:text-black text-white text-xs cursor-pointer"
            >
              →
            </button>
          </div>
        </div>

        {/* Q and Light toggle buttons row */}
        <div className="flex-1 flex items-center border border-white">
          <button
            onClick={handleQuantizationToggle}
            className={`flex-1 h-full text-xs border-r border-white cursor-pointer min-w-0 ${quantizationEnabled
              ? 'bg-white text-black'
              : 'bg-black text-white hover:bg-white hover:text-black'
              }`}
            data-tutorial={`quantization-${trackNumber - 1}`}
          >
            Q {quantizationEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={onLightingToggle}
            className={`flex-1 h-full text-xs cursor-pointer min-w-0 ${useLighting
              ? 'bg-white text-black'
              : 'bg-black text-white hover:bg-white hover:text-black'
              }`}
            data-tutorial={`lighting-${trackNumber - 1}`}
          >
            LIGHT {useLighting ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Volume Control Column */}
      <div className="flex flex-col items-center justify-between h-full border border-white border-opacity-50 px-1 py-2 w-12">
        <span className="text-white text-xs">{Math.round(trackVolume * 100)}%</span>
        <div className="flex items-center justify-center flex-1">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={trackVolume}
            onChange={(e) => setTrackVolume(parseFloat(e.target.value))}
            className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider transform -rotate-90"
          />
        </div>
        <span className="text-white text-xs">VOL</span>
      </div>

      {/* Only show tooltip for track 3 (trackNumber === 3) */}
      {trackNumber === 3 && (
        <InlineTooltip
          title="Track Controls"
          content={`• MUTE track.
• FREEZE locks in the pattern based on the previous 16 steps. When FREEZE is OFF, the sequencer gets its input exclusively from the Particle Box. When FREEZE is ON, edit the pattern with the sequence pads or TRIGGER.
• TRIGGER plays a hit immediately. While playing with FREEZE and Q on, it adds the hit to the nearest sixteenth-note step. With FREEZE off or playback stopped, it only auditions the sound. MUTE silences it.
• CLEAR erases this track's recorded steps. With FREEZE off, particles continue generating new steps.
• Use + and − buttons to control number of particles.
• Adjust the sample with the arrow keys
• Q turns quantization on and off (when the particle hits the wall, it will be quantized to the nearest 16th note).
• LIGHT turns reverb on and off.`}
          position="right"
          offsetX={-100}
          isVisible={isTutorialActive}
        />
      )}
    </div>
  );
};
