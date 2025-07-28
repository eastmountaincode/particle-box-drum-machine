'use client'

import { ParticleBox } from '@/components/ParticleBox';
import { ControlPanel } from '@/components/ControlPanel';
import { GlobalControls } from '@/components/GlobalControls';
import { SequencerDisplay } from '@/components/SequencerDisplay';
import { TutorialProvider } from '@/components/Tutorial/TutorialContext';
import { CreditsTooltip } from '@/components/Tutorial/CreditsTooltip';
import { useTutorial } from '@/components/Tutorial/TutorialContext';
import { useAtom } from 'jotai';
import { getParticleCountAtom, getLightingAtom, currentStepAtom, isPlayingAtom, getSequencerStepsAtom, visualModeAtom } from '@/store/atoms';
import { useState, useEffect } from 'react';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useRandomizeSamples } from '@/hooks/useRandomizeSamples';
import { useRandomizeParticleCounts } from '@/hooks/useRandomizeParticleCounts';
import { useQuantization } from '@/hooks/useQuantization';
import { useTrackSamplePlayback } from '@/hooks/useTrackSamplePlayback';

export default function Home() {
    const [bpm, setBpm] = useState(120);
    const [currentStep] = useAtom(currentStepAtom);
    const [_, setGlobalIsPlaying] = useAtom(isPlayingAtom);
    const [visualMode] = useAtom(visualModeAtom);
    const [screenWidth, setScreenWidth] = useState(0);

    const { isPlaying, start, stop, registerStepCallback, unregisterStepCallback } = useAudioEngine(bpm);

    // Check screen width on mount and resize
    useEffect(() => {
        const checkScreenWidth = () => {
            setScreenWidth(window.innerWidth);
        };

        // Initial check
        checkScreenWidth();

        // Add resize listener
        window.addEventListener('resize', checkScreenWidth);

        // Cleanup
        return () => window.removeEventListener('resize', checkScreenWidth);
    }, []);

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

    // Show message for narrow screens
    if (screenWidth < 1140 && screenWidth > 0) {
        return (
            <div className="w-full h-screen bg-black flex items-center justify-center border border-white border-opacity-50">
                <div className="text-center p-8 border border-white border-opacity-50 bg-black">
                    <h1 className="text-white text-2xl mb-4 font-mono">PARTICLE BOX DRUM MACHINE</h1>
                    <p className="text-white text-lg mb-2">This application requires a wider screen</p>
                    <p className="text-white text-sm opacity-75">Minimum width: 1140px</p>
                    <p className="text-white text-sm opacity-75">Current width: {screenWidth}px</p>
                </div>
            </div>
        );
    }

    return (
        <TutorialProvider>
            <MainContent 
                isPlaying={isPlaying}
                currentStep={currentStep}
                bpm={bpm}
                onPlayStop={handlePlayStop}
                onBpmChange={setBpm}
                registerStepCallback={registerStepCallback}
                unregisterStepCallback={unregisterStepCallback}
                visualMode={visualMode}
            />
        </TutorialProvider>
    );
}

const MainContent: React.FC<{
    isPlaying: boolean;
    currentStep: number;
    bpm: number;
    onPlayStop: () => void;
    onBpmChange: (bpm: number) => void;
    registerStepCallback: (trackIndex: number, callback: (step: number) => void) => void;
    unregisterStepCallback: (trackIndex: number) => void;
    visualMode: boolean;
}> = ({ isPlaying, currentStep, bpm, onPlayStop, onBpmChange, registerStepCallback, unregisterStepCallback, visualMode }) => {
    const { isTutorialActive } = useTutorial();

    return (
        <>
            <div className="w-full h-screen bg-black p-4 pl-8 pr-8 pb-8 border border-white border-opacity-50">
                <div className="w-full h-full flex flex-col gap-3">
                    {/* Global Drum Sequencer Controls */}
                    <div className="flex justify-center">
                        <GlobalControls
                            isPlaying={isPlaying}
                            currentStep={currentStep}
                            bpm={bpm}
                            onPlayStop={onPlayStop}
                            onBpmChange={onBpmChange}
                        />
                    </div>

                    {/* Track Rows */}
                    <div className={visualMode ? "flex flex-col gap-4" : "flex-1 flex flex-col gap-4"}>
                        {[1, 2, 3, 4].map((row, index) => (
                            <TrackRow 
                                key={row} 
                                index={index} 
                                trackNumber={row} 
                                currentStep={currentStep} 
                                bpm={bpm}
                                registerStepCallback={registerStepCallback}
                                unregisterStepCallback={unregisterStepCallback}
                                visualMode={visualMode}
                            />
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Credits Tooltip */}
            <CreditsTooltip isVisible={isTutorialActive} />
        </>
    );
};

const TrackRow: React.FC<{ 
    index: number; 
    trackNumber: number; 
    currentStep: number; 
    bpm: number;
    registerStepCallback: (trackIndex: number, callback: (step: number) => void) => void;
    unregisterStepCallback: (trackIndex: number) => void;
    visualMode: boolean;
}> = ({ index, trackNumber, currentStep, bpm, registerStepCallback, unregisterStepCallback, visualMode }) => {
    const [particleCount, setParticleCount] = useAtom(getParticleCountAtom(index));
    const [useLighting, setUseLighting] = useAtom(getLightingAtom(index));
    const [steps, setSteps] = useAtom(getSequencerStepsAtom(index));

    const { registerHit } = useQuantization({
        trackIndex: index,
        bpm
    });

    // Per-track sample playback - now returns a callback instead of using useEffect
    const { onStepTriggered } = useTrackSamplePlayback(index);

    // Register the step callback with the audio engine
    useEffect(() => {
        registerStepCallback(index, onStepTriggered);
        
        return () => {
            unregisterStepCallback(index);
        };
    }, [index, onStepTriggered, registerStepCallback, unregisterStepCallback]);

    const handleStepToggle = (stepIndex: number) => {
        const newSteps = [...steps];
        newSteps[stepIndex] = !newSteps[stepIndex];
        setSteps(newSteps);
    };

    if (visualMode) {
        // Visual mode: Only show particle boxes, same size as tech mode
        return (
            <div className="flex justify-center items-center" style={{ height: 'calc((100vh - 10rem) / 4)' }}>
                <div
                    className="border border-white border-opacity-50 flex-shrink-0"
                    style={{
                        // Same size as tech mode
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
            </div>
        );
    }

    // Normal mode: Show all controls
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
