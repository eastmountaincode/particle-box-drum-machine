'use client'

import { ParticleBox } from '@/components/ParticleBox';
import { ControlPanel } from '@/components/ControlPanel';
import { GlobalControls } from '@/components/GlobalControls';
import { SequencerDisplay } from '@/components/SequencerDisplay';
import { useAtom } from 'jotai';
import { getParticleCountAtom, getLightingAtom, currentStepAtom, isPlayingAtom, getSequencerStepsAtom } from '@/store/atoms';
import { useState, useEffect } from 'react';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useRandomizeSamples } from '@/hooks/useRandomizeSamples';
import { useRandomizeParticleCounts } from '@/hooks/useRandomizeParticleCounts';
import { useQuantization } from '@/hooks/useQuantization';
import { useTrackSamplePlayback } from '@/hooks/useTrackSamplePlayback';

export default function Home() {
    const [bpm, setBpm] = useState(60);
    const [currentStep] = useAtom(currentStepAtom);
    const [_, setGlobalIsPlaying] = useAtom(isPlayingAtom);

    const { isPlaying, start, stop } = useAudioEngine(bpm);

    // Sync audio engine state with global atom
    useEffect(() => {
        setGlobalIsPlaying(isPlaying);
    }, [isPlaying, setGlobalIsPlaying]);

    // Randomize samples and particle counts on client-side mount
    useRandomizeSamples();
    useRandomizeParticleCounts();

    const handlePlayStop = async () => {
        if (isPlaying) {
            stop();
        } else {
            await start();
        }
    };

    return (
        <div className="w-full h-screen bg-black p-4 pl-8 pr-8 pb-8 border border-white border-opacity-50">
            <div className="w-full h-full flex flex-col gap-3">
                {/* Global Drum Sequencer Controls */}
                <div className="flex justify-center">
                    <GlobalControls
                        isPlaying={isPlaying}
                        currentStep={currentStep}
                        bpm={bpm}
                        onPlayStop={handlePlayStop}
                        onBpmChange={setBpm}
                    />
                </div>

                {/* Track Rows */}
                <div className="flex-1 flex flex-col gap-4">
                    {[1, 2, 3, 4].map((row, index) => (
                        <TrackRow key={row} index={index} trackNumber={row} currentStep={currentStep} bpm={bpm} />
                    ))}
                </div>
            </div>
        </div>
    );
}

const TrackRow: React.FC<{ index: number; trackNumber: number; currentStep: number; bpm: number }> = ({ index, trackNumber, currentStep, bpm }) => {
    const [particleCount, setParticleCount] = useAtom(getParticleCountAtom(index));
    const [useLighting, setUseLighting] = useAtom(getLightingAtom(index));
    const [steps, setSteps] = useAtom(getSequencerStepsAtom(index));

    const { registerHit } = useQuantization({
        trackIndex: index,
        bpm
    });

    // Per-track sample playback (listens to global transport)
    useTrackSamplePlayback(index);

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
                    onWallHit={registerHit}
                    trackIndex={index}
                />
            </div>

            {/* Control panel - wider fixed width */}
            <div className="w-64 flex-shrink-0">
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
