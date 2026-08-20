'use client'

import { useCallback, useEffect, useId, useState } from 'react';
import { useAtom } from 'jotai';
import { reverbDecayAtom, reverbRoomSizeAtom, reverbWetAtom } from '@/store/atoms';
import { AppModal, appModalTriggerClass } from './AppModal';

export function ReverbModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [reverbWet, setReverbWet] = useAtom(reverbWetAtom);
    const [reverbDecay, setReverbDecay] = useAtom(reverbDecayAtom);
    const [reverbRoomSize, setReverbRoomSize] = useAtom(reverbRoomSizeAtom);
    const [localReverbWet, setLocalReverbWet] = useState(reverbWet);
    const [localReverbDecay, setLocalReverbDecay] = useState(reverbDecay);
    const [localReverbRoomSize, setLocalReverbRoomSize] = useState(reverbRoomSize);
    const wetId = useId();
    const decayId = useId();
    const roomId = useId();

    useEffect(() => setLocalReverbWet(reverbWet), [reverbWet]);
    useEffect(() => setLocalReverbDecay(reverbDecay), [reverbDecay]);
    useEffect(() => setLocalReverbRoomSize(reverbRoomSize), [reverbRoomSize]);

    const openModal = useCallback(() => setIsOpen(true), []);
    const closeModal = useCallback(() => setIsOpen(false), []);

    return (
        <>
            <button
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                className={appModalTriggerClass}
                data-testid="reverb-trigger"
                onClick={openModal}
            >
                REVERB
            </button>

            <AppModal isOpen={isOpen} onClose={closeModal} title="REVERB" testId="reverb-modal">
                <div className="grid grid-cols-3 gap-2">
                    <label className="flex flex-col items-center gap-2 border border-white border-opacity-50 p-3 text-xs" htmlFor={wetId}>
                        <span>WET</span>
                        <input
                            id={wetId}
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={localReverbWet}
                            onBlur={(event) => setReverbWet(parseFloat(event.currentTarget.value))}
                            onChange={(event) => setLocalReverbWet(parseFloat(event.target.value))}
                            onKeyUp={(event) => setReverbWet(parseFloat(event.currentTarget.value))}
                            onPointerUp={(event) => setReverbWet(parseFloat(event.currentTarget.value))}
                            className="slider h-1 w-16 cursor-pointer appearance-none rounded-lg bg-gray-700"
                        />
                        <output htmlFor={wetId}>{localReverbWet.toFixed(1)}</output>
                    </label>

                    <label className="flex flex-col items-center gap-2 border border-white border-opacity-50 p-3 text-xs" htmlFor={decayId}>
                        <span>DECAY</span>
                        <input
                            id={decayId}
                            type="range"
                            min="0.1"
                            max="10"
                            step="0.1"
                            value={localReverbDecay}
                            onBlur={(event) => setReverbDecay(parseFloat(event.currentTarget.value))}
                            onChange={(event) => setLocalReverbDecay(parseFloat(event.target.value))}
                            onKeyUp={(event) => setReverbDecay(parseFloat(event.currentTarget.value))}
                            onPointerUp={(event) => setReverbDecay(parseFloat(event.currentTarget.value))}
                            className="slider h-1 w-16 cursor-pointer appearance-none rounded-lg bg-gray-700"
                        />
                        <output htmlFor={decayId}>{localReverbDecay.toFixed(1)}s</output>
                    </label>

                    <label className="flex flex-col items-center gap-2 border border-white border-opacity-50 p-3 text-xs" htmlFor={roomId}>
                        <span>ROOM</span>
                        <input
                            id={roomId}
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={localReverbRoomSize}
                            onBlur={(event) => setReverbRoomSize(parseFloat(event.currentTarget.value))}
                            onChange={(event) => setLocalReverbRoomSize(parseFloat(event.target.value))}
                            onKeyUp={(event) => setReverbRoomSize(parseFloat(event.currentTarget.value))}
                            onPointerUp={(event) => setReverbRoomSize(parseFloat(event.currentTarget.value))}
                            className="slider h-1 w-16 cursor-pointer appearance-none rounded-lg bg-gray-700"
                        />
                        <output htmlFor={roomId}>{localReverbRoomSize.toFixed(1)}</output>
                    </label>
                </div>
            </AppModal>
        </>
    );
}
