'use client'

import { ParticleBox } from '@/components/ParticleBox';
import { ControlPanel } from '@/components/ControlPanel';
import { AudioOutputModal } from '@/components/AudioOutputModal';
import { DrumKitsModal } from '@/components/DrumKitsModal';
import { GlobalControls } from '@/components/GlobalControls';
import { MidiClockModal } from '@/components/MidiClockModal';
import { ReverbModal } from '@/components/ReverbModal';
import { SequencerDisplay } from '@/components/SequencerDisplay';
import { TutorialProvider } from '@/components/Tutorial/TutorialContext';
import { CreditsTooltip } from '@/components/Tutorial/CreditsTooltip';
import { useTutorial } from '@/components/Tutorial/TutorialContext';
import { useAtom } from 'jotai';
import { getParticleCountAtom, getLightingAtom, currentStepAtom, isPlayingAtom, getSequencerStepsAtom, visualModeAtom } from '@/store/atoms';
import { useCallback, useState, useEffect } from 'react';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useMidi } from '@/hooks/useMidi';
import { useRandomizeSamples } from '@/hooks/useRandomizeSamples';
import { useRandomizeParticleCounts } from '@/hooks/useRandomizeParticleCounts';
import { useCollisionPlayback } from '@/hooks/useCollisionPlayback';
import { useDrumSamples } from '@/hooks/useDrumSamples';
import { useQuantization } from '@/hooks/useQuantization';
import { useTrackSamplePlayback } from '@/hooks/useTrackSamplePlayback';
import { disposeSamplePreloader } from '@/hooks/useSamplePreloader';
import { useViewportScale } from '@/hooks/useViewportScale';

const MIN_LAYOUT_WIDTH = 1200;
const MIN_LAYOUT_HEIGHT = 720;

export default function Home() {
    const [bpm, setBpm] = useState(120);
    const [currentStep] = useAtom(currentStepAtom);
    const [, setGlobalIsPlaying] = useAtom(isPlayingAtom);
    const [visualMode] = useAtom(visualModeAtom);
    const viewport = useViewportScale(MIN_LAYOUT_WIDTH, MIN_LAYOUT_HEIGHT, {
        allowNarrowWidth: visualMode,
    });

    const { isPlaying, start, stop, registerStepCallback, unregisterStepCallback, prepareExternalClock, handleExternalStep, handleExternalStart, handleExternalContinue, handleExternalStop } = useAudioEngine(bpm);

    const midi = useMidi({ prepareExternalClock, handleExternalStep, handleExternalStart, handleExternalContinue, handleExternalStop });

    // Sync audio engine state with global atom
    useEffect(() => {
        setGlobalIsPlaying(isPlaying);
    }, [isPlaying, setGlobalIsPlaying]);

    // Randomize samples and particle counts on client-side mount
    useRandomizeSamples();
    useRandomizeParticleCounts();

    // Cleanup sample preloader on app unmount
    useEffect(() => {
        return () => {
            disposeSamplePreloader();
        };
    }, []);

    const handlePlayStop = async () => {
        if (isPlaying) {
            stop();
        } else {
            await start();
        }
    };

    return (
        <main
            ref={viewport.containerRef}
            className="fixed inset-0 overflow-hidden bg-black"
            data-testid="app-viewport"
        >
            {viewport.isReady && (
                <div
                    data-testid="app-canvas"
                    data-layout-mode={visualMode ? 'column' : 'full'}
                    data-scale={viewport.scale.toFixed(4)}
                    style={{
                        position: 'absolute',
                        left: `${viewport.offsetX}px`,
                        top: `${viewport.offsetY}px`,
                        width: `${viewport.logicalWidth}px`,
                        height: `${viewport.logicalHeight}px`,
                        transform: `scale(${viewport.scale})`,
                        transformOrigin: 'top left',
                        containerType: 'size',
                    }}
                >
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
                            midi={midi}
                        />
                    </TutorialProvider>
                </div>
            )}
        </main>
    );
}

const MainContent: React.FC<{
    isPlaying: boolean;
    currentStep: number;
    bpm: number;
    onPlayStop: () => void;
    onBpmChange: (bpm: number) => void;
    registerStepCallback: (trackIndex: number, callback: (step: number, time?: number) => void) => void;
    unregisterStepCallback: (trackIndex: number) => void;
    visualMode: boolean;
    midi: ReturnType<typeof useMidi>;
}> = ({ isPlaying, currentStep, bpm, onPlayStop, onBpmChange, registerStepCallback, unregisterStepCallback, visualMode, midi }) => {
    const { isTutorialActive } = useTutorial();

    return (
        <>
            <div className="h-full w-full border border-white border-opacity-50 bg-black p-4 pr-8 pb-8 pl-8">
                <div className="w-full h-full flex flex-col gap-3">
                    {/* Global transport and compact settings launchers */}
                    <header
                        className="flex shrink-0 items-center justify-center gap-3"
                        data-testid="app-header"
                    >
                        <GlobalControls
                            isPlaying={isPlaying}
                            currentStep={currentStep}
                            bpm={bpm}
                            onPlayStop={onPlayStop}
                            onBpmChange={onBpmChange}
                        />
                        {!visualMode && (
                            <div className="flex shrink-0 items-center gap-2">
                                <DrumKitsModal />
                                <ReverbModal />
                                <MidiClockModal {...midi} isPlaying={isPlaying} />
                                <AudioOutputModal />
                            </div>
                        )}
                    </header>

                    {/* Track Rows */}
                    <div className={visualMode ? "flex flex-col gap-4" : "flex-1 flex flex-col gap-4"}>
                        {[1, 2, 3, 4].map((row, index) => (
                            <TrackRow 
                                key={row} 
                                index={index} 
                                trackNumber={row} 
                                currentStep={currentStep} 
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
    registerStepCallback: (trackIndex: number, callback: (step: number, time?: number) => void) => void;
    unregisterStepCallback: (trackIndex: number) => void;
    visualMode: boolean;
}> = ({ index, trackNumber, currentStep, registerStepCallback, unregisterStepCallback, visualMode }) => {
    const [particleCount, setParticleCount] = useAtom(getParticleCountAtom(index));
    const [useLighting, setUseLighting] = useAtom(getLightingAtom(index));
    const [steps, setSteps] = useAtom(getSequencerStepsAtom(index));
    const { playSample } = useDrumSamples(index);
    const { onCollisionHit } = useCollisionPlayback(index, playSample);

    const { registerHit, onStepTriggered: onQuantizedStep } = useQuantization({
        trackIndex: index,
        playSample,
    });

    // Per-track sample playback - now returns a callback instead of using useEffect
    const { onStepTriggered } = useTrackSamplePlayback(index, playSample);

    const handleStepTriggered = useCallback((step: number, time?: number) => {
        onQuantizedStep(step, time);
        onStepTriggered(step, time);
    }, [onQuantizedStep, onStepTriggered]);

    // Register the step callback with the audio engine
    useEffect(() => {
        registerStepCallback(index, handleStepTriggered);
        
        return () => {
            unregisterStepCallback(index);
        };
    }, [handleStepTriggered, index, registerStepCallback, unregisterStepCallback]);

    const handleStepToggle = (stepIndex: number) => {
        const newSteps = [...steps];
        newSteps[stepIndex] = !newSteps[stepIndex];
        setSteps(newSteps);
    };

    if (visualMode) {
        // Visual mode: Only show particle boxes, same size as tech mode
        return (
            <div
                className="flex justify-center items-center"
                data-testid={`track-row-${index}`}
                style={{ height: 'calc((100cqh - 10rem) / 4)' }}
            >
                <div
                    className="border border-white border-opacity-50 flex-shrink-0"
                    style={{
                        width: 'min(100%, calc((100cqh - 10rem) / 4))',
                        aspectRatio: '1 / 1'
                    }}
                >
                    <ParticleBox
                        useLighting={useLighting}
                        particleCount={particleCount}
                        onWallHit={registerHit}
                        onCollisionHit={onCollisionHit}
                        trackIndex={index}
                    />
                </div>
            </div>
        );
    }

    // Normal mode: Show all controls
    return (
        <div className="flex-1 flex gap-4" data-testid={`track-row-${index}`}>
            {/* Square particle box container */}
            <div
                className="border border-white border-opacity-50 flex-shrink-0"
                style={{
                    width: 'min(calc(25cqh - 1rem), calc(25cqw - 1rem), calc((100cqh - 10rem) / 4))',
                    height: 'min(calc(25cqh - 1rem), calc(25cqw - 1rem), calc((100cqh - 10rem) / 4))'
                }}
            >
                <ParticleBox
                    useLighting={useLighting}
                    particleCount={particleCount}
                    onWallHit={registerHit}
                    onCollisionHit={onCollisionHit}
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
            <div className="min-w-0 flex-1">
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
