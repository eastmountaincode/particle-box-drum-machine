'use client'

import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { IoRefresh, IoDesktopOutline } from 'react-icons/io5';
import { getFreezeAtom, globalVolumeAtom, visualModeAtom } from '@/store/atoms';
import { TutorialButton } from './Tutorial/TutorialButton';
import { InlineTooltip } from './Tutorial/InlineTooltip';
import { useTutorial } from './Tutorial/TutorialContext';

const MIN_BPM = 1;
const MAX_BPM = 300;

interface GlobalControlsProps {
    isPlaying: boolean;
    currentStep: number;
    bpm: number;
    onPlayStop: () => void;
    onBpmChange: (bpm: number) => void;
}

export const GlobalControls: React.FC<GlobalControlsProps> = ({
    isPlaying,
    currentStep,
    bpm,
    onPlayStop,
    onBpmChange
}) => {
    const [inputValue, setInputValue] = useState(bpm.toString());

    // Visual mode state
    const [visualMode, setVisualMode] = useAtom(visualModeAtom);

    // Read every track so the global action also reflects partial freeze states.
    const [freeze1, setFreeze1] = useAtom(getFreezeAtom(0));
    const [freeze2, setFreeze2] = useAtom(getFreezeAtom(1));
    const [freeze3, setFreeze3] = useAtom(getFreezeAtom(2));
    const [freeze4, setFreeze4] = useAtom(getFreezeAtom(3));
    const anyTrackFrozen = freeze1 || freeze2 || freeze3 || freeze4;

    // Global volume
    const [globalVolume, setGlobalVolume] = useAtom(globalVolumeAtom);

    // Tutorial state
    const { isTutorialActive, setTutorialActive } = useTutorial();

    useEffect(() => {
        setInputValue(bpm.toString());
    }, [bpm]);

    const handleFreezeAllToggle = () => {
        const nextFreezeState = !anyTrackFrozen;
        setFreeze1(nextFreezeState);
        setFreeze2(nextFreezeState);
        setFreeze3(nextFreezeState);
        setFreeze4(nextFreezeState);
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleTutorialToggle = () => {
        setTutorialActive(!isTutorialActive);
    };

    // Close tutorial when switching to visual mode
    useEffect(() => {
        if (visualMode && isTutorialActive) {
            setTutorialActive(false);
        }
    }, [visualMode, isTutorialActive, setTutorialActive]);

    return (
        <div className="flex shrink-0 items-center gap-4 whitespace-nowrap bg-black border border-white border-opacity-50 p-2 pl-3 pr-3 select-none">
            {/* Play/Stop Button - Only show in tech mode */}
            {!visualMode && (
                <button
                    onClick={onPlayStop}
                    className="bg-black hover:bg-white hover:text-black text-white text-xs py-2 border border-white border-opacity-50 cursor-pointer w-16 text-center"
                >
                    {isPlaying ? 'STOP' : 'PLAY'}
                </button>
            )}

            {/* All other controls - only show when NOT in visual mode */}
            {!visualMode && (
                <>
                    {/* Step Counter */}
                    <div className="flex items-center gap-2">
                        <span className="text-white text-xs">STEP:</span>
                        <span className="text-white text-xs bg-black px-2 py-1 border border-white border-opacity-50 w-8 flex items-center justify-center">
                            {String(currentStep + 1).padStart(2, '0')}
                        </span>
                    </div>

                    {/* BPM Control */}
                    <div className="flex items-center gap-2">
                        <span className="text-white text-xs">BPM:</span>
                        <div className="flex items-center border border-white border-opacity-50">
                            <button
                                onClick={() => onBpmChange(Math.max(MIN_BPM, bpm - 1))}
                                className="bg-black hover:bg-white hover:text-black text-white text-xs px-2 py-1 border-r border-white border-opacity-50 cursor-pointer"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                value={inputValue}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setInputValue(value);

                                    if (value === '') {
                                        return; // Allow empty input
                                    }

                                    const newBpm = parseInt(value);
                                    if (!isNaN(newBpm) && newBpm >= MIN_BPM && newBpm <= MAX_BPM) {
                                        onBpmChange(newBpm);
                                    }
                                }}
                                onBlur={() => {
                                    const newBpm = parseInt(inputValue);
                                    if (isNaN(newBpm) || newBpm < MIN_BPM) {
                                        setInputValue(MIN_BPM.toString());
                                        onBpmChange(MIN_BPM);
                                    } else if (newBpm > MAX_BPM) {
                                        setInputValue(MAX_BPM.toString());
                                        onBpmChange(MAX_BPM);
                                    }
                                }}
                                className="text-white text-xs bg-black px-2 py-1 w-16 text-center border-0 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                min={MIN_BPM.toString()}
                                max={MAX_BPM.toString()}
                            />
                            <button
                                onClick={() => onBpmChange(Math.min(MAX_BPM, bpm + 1))}
                                className="bg-black hover:bg-white hover:text-black text-white text-xs px-2 py-1 border-l border-white border-opacity-50 cursor-pointer"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Global Volume Control */}
                    <div className="flex items-center gap-2">
                        <span className="text-white text-xs">VOLUME:</span>
                        <div className="flex flex-col items-center">
                            <span className="text-white text-xs mb-1">&nbsp;</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={globalVolume}
                                onChange={(e) => setGlobalVolume(parseFloat(e.target.value))}
                                className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <span className="text-white text-xs mt-1">{Math.round(globalVolume * 100)}%</span>
                        </div>
                    </div>

                    {/* Freeze All Button with inline tooltip */}
                    <div className="relative">
                        <button
                            type="button"
                            aria-label={anyTrackFrozen ? 'Unfreeze all tracks' : 'Freeze all tracks'}
                            data-testid="freeze-all-toggle"
                            onClick={handleFreezeAllToggle}
                            className={`w-28 cursor-pointer border border-white border-opacity-50 px-3 py-2 text-center text-xs ${anyTrackFrozen
                                ? 'bg-white text-black hover:bg-black hover:text-white'
                                : 'bg-black text-white hover:bg-white hover:text-black'
                                }`}
                        >
                            {anyTrackFrozen ? 'UNFREEZE ALL' : 'FREEZE ALL'}
                        </button>
                        <InlineTooltip
                            title={anyTrackFrozen ? 'Unfreeze All' : 'Freeze All'}
                            content={anyTrackFrozen
                                ? 'Release every frozen track and return all patterns to live particle input.'
                                : 'Freeze the patterns of all 4 tracks - basically, lock in the previous 16 hits for all tracks.'}
                            position="bottom"
                            width="w-80"
                            isVisible={isTutorialActive}
                        />
                    </div>

                    {/* Refresh Button with inline tooltip */}
                    <div className="relative">
                        <button
                            onClick={handleRefresh}
                            className="bg-black hover:bg-white hover:text-black text-white py-2 px-2 border border-white border-opacity-50 cursor-pointer"
                            title="Refresh Page"
                        >
                            <IoRefresh size={16} />
                        </button>
                        <InlineTooltip
                            title="Refresh"
                            content="Reload the page to reset everything and generate new random starting configurations."
                            position="bottom"
                            isVisible={isTutorialActive}
                        />
                    </div>
                </>
            )}

            {/* Visual Mode Toggle - Always visible, far right */}
            <button
                onClick={() => setVisualMode(!visualMode)}
                className={`bg-black hover:bg-white hover:text-black text-white text-xs py-2 px-3 border border-black hover:border-white cursor-pointer ${visualMode ? 'border-black' : 'border-white'}`}
                title={visualMode ? "Switch to Tech Mode" : "Switch to Visual Mode"}
            >
                {visualMode ? (
                    <IoDesktopOutline size={16} />
                ) : (
                    'TECH MODE'
                )}
            </button>

            {/* Tutorial Button - Only show in tech mode */}
            {!visualMode && (
                <TutorialButton onClick={handleTutorialToggle} isActive={isTutorialActive} />
            )}
        </div>
    );
};
