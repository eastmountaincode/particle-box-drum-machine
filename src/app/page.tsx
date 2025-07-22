'use client'

import { ParticleBox } from '@/components/ParticleBox';
import { ControlPanel } from '@/components/ControlPanel';
import { DrumSequencerControls } from '@/components/DrumSequencerControls';
import { SequencerDisplay } from '@/components/SequencerDisplay';
import { useAtom } from 'jotai';
import { getParticleCountAtom, getLightingAtom, currentStepAtom } from '@/store/atoms';
import { useState } from 'react';
import { useAudioEngine } from '@/hooks/useAudioEngine';

export default function Home() {
  const [bpm, setBpm] = useState(120);
  const [currentStep] = useAtom(currentStepAtom);
  const totalSteps = 16;
  
  const { isPlaying, start, stop } = useAudioEngine(bpm);

  const handlePlayStop = async () => {
    if (isPlaying) {
      stop();
    } else {
      await start();
    }
  };

  return (
    <div className="w-full h-screen bg-black p-4">
      <div className="w-full h-full flex flex-col gap-3">
        {/* Global Drum Sequencer Controls */}
        <div className="flex justify-center">
          <DrumSequencerControls
            isPlaying={isPlaying}
            currentStep={currentStep}
            totalSteps={totalSteps}
            bpm={bpm}
            onPlayStop={handlePlayStop}
            onBpmChange={setBpm}
          />
        </div>

        {/* Track Rows */}
        <div className="flex-1 flex flex-col gap-4">
          {[1, 2, 3, 4].map((row, index) => (
            <TrackRow key={row} index={index} trackNumber={row} currentStep={currentStep} />
          ))}
        </div>
      </div>
    </div>
  );
}

const TrackRow: React.FC<{ index: number; trackNumber: number; currentStep: number }> = ({ index, trackNumber, currentStep }) => {
  const [particleCount, setParticleCount] = useAtom(getParticleCountAtom(index));
  const [useLighting, setUseLighting] = useAtom(getLightingAtom(index));
  const [steps, setSteps] = useState<boolean[]>(new Array(16).fill(false));

  const handleStepToggle = (stepIndex: number) => {
    const newSteps = [...steps];
    newSteps[stepIndex] = !newSteps[stepIndex];
    setSteps(newSteps);
  };

  return (
    <div className="flex-1 flex gap-4">
      {/* Square particle box container */}
      <div
        className="border border-white border-opacity-50 flex-shrink-0"
        style={{
          width: 'min(calc(25vh - 1rem), calc(25vw - 1rem), calc((100vh - 10rem) / 4))',
          height: 'min(calc(25vh - 1rem), calc(25vw - 1rem), calc((100vh - 10rem) / 4))'
        }}
      >
        <ParticleBox
          useLighting={useLighting}
          particleCount={particleCount}
        />
      </div>

      {/* Control panel - fixed width */}
      <div className="w-48 flex-shrink-0">
        <ControlPanel
          trackNumber={trackNumber}
          useLighting={useLighting}
          onLightingToggle={() => setUseLighting(!useLighting)}
          particleCount={particleCount}
          onParticleCountChange={setParticleCount}
        />
      </div>

      {/* Sequencer display takes remaining space */}
      <div className="flex-1">
        <SequencerDisplay
          trackNumber={trackNumber}
          currentStep={currentStep}
          steps={steps}
          onStepToggle={handleStepToggle}
        />
      </div>
    </div>
  );
};
