'use client'

import React, { useState, useEffect } from 'react';

const MIN_BPM = 1;
const MAX_BPM = 300;

interface DrumSequencerControlsProps {
    isPlaying: boolean;
    currentStep: number;
    totalSteps: number;
    bpm: number;
    onPlayStop: () => void;
    onBpmChange: (bpm: number) => void;
}

export const DrumSequencerControls: React.FC<DrumSequencerControlsProps> = ({
    isPlaying,
    currentStep,
    totalSteps,
    bpm,
    onPlayStop,
    onBpmChange
}) => {
    const [inputValue, setInputValue] = useState(bpm.toString());

    useEffect(() => {
        setInputValue(bpm.toString());
    }, [bpm]);
    return (
        <div className="flex items-center gap-4 bg-black border border-white border-opacity-50 p-2">
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
        </div>
    );
};