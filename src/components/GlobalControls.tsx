'use client'

import React, { useState, useEffect } from 'react';
import { useSetAtom, useAtom } from 'jotai';
import { IoRefresh } from 'react-icons/io5';
import { getFreezeAtom, reverbWetAtom, reverbDecayAtom, reverbRoomSizeAtom, globalVolumeAtom } from '@/store/atoms';

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

    // Get setters for all freeze atoms
    const setFreeze1 = useSetAtom(getFreezeAtom(0));
    const setFreeze2 = useSetAtom(getFreezeAtom(1));
    const setFreeze3 = useSetAtom(getFreezeAtom(2));
    const setFreeze4 = useSetAtom(getFreezeAtom(3));

    // Reverb parameters
    const [reverbWet, setReverbWet] = useAtom(reverbWetAtom);
    const [reverbDecay, setReverbDecay] = useAtom(reverbDecayAtom);
    const [reverbRoomSize, setReverbRoomSize] = useAtom(reverbRoomSizeAtom);

    // Global volume
    const [globalVolume, setGlobalVolume] = useAtom(globalVolumeAtom);

    useEffect(() => {
        setInputValue(bpm.toString());
    }, [bpm]);

    const handleFreezeAll = () => {
        // Trigger freeze for all tracks
        setFreeze1(true);
        setFreeze2(true);
        setFreeze3(true);
        setFreeze4(true);
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="flex items-center gap-4 bg-black border border-white border-opacity-50 p-2 pl-3 pr-3 select-none">
            {/* Play/Stop Button */}
            <button
                onClick={onPlayStop}
                className="bg-black hover:bg-white hover:text-black text-white text-xs py-2 border border-white border-opacity-50 cursor-pointer w-16 text-center"
            >
                {isPlaying ? 'STOP' : 'PLAY'}
            </button>

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

            {/* Freeze All Button */}
            <button
                onClick={handleFreezeAll}
                className="bg-black hover:bg-white hover:text-black text-white text-xs py-2 px-3 border border-white border-opacity-50 cursor-pointer"
            >
                FREEZE ALL
            </button>

            {/* Reverb Controls */}
            <div className="flex items-center gap-2">
                <span className="text-white text-xs">REVERB:</span>
                
                {/* Wet/Dry Control */}
                <div className="flex flex-col items-center">
                    <span className="text-white text-xs mb-1">WET</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={reverbWet}
                        onChange={(e) => setReverbWet(parseFloat(e.target.value))}
                        className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-white text-xs mt-1">{reverbWet.toFixed(1)}</span>
                </div>

                {/* Decay Control */}
                <div className="flex flex-col items-center">
                    <span className="text-white text-xs mb-1">DECAY</span>
                    <input
                        type="range"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={reverbDecay}
                        onChange={(e) => setReverbDecay(parseFloat(e.target.value))}
                        className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-white text-xs mt-1">{reverbDecay.toFixed(1)}s</span>
                </div>

                {/* Room Size Control */}
                <div className="flex flex-col items-center">
                    <span className="text-white text-xs mb-1">ROOM</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={reverbRoomSize}
                        onChange={(e) => setReverbRoomSize(parseFloat(e.target.value))}
                        className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-white text-xs mt-1">{reverbRoomSize.toFixed(1)}</span>
                </div>
            </div>

            {/* Refresh Button - Far Right */}
            <button
                onClick={handleRefresh}
                className="bg-black hover:bg-white hover:text-black text-white py-2 px-2 border border-white border-opacity-50 cursor-pointer"
                title="Refresh Page"
            >
                <IoRefresh size={16} />
            </button>
        </div>
    );
}; 