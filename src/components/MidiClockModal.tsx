'use client'

import { useCallback, useState } from 'react';
import type { SyncMode } from '@/store/atoms';
import { AppModal, appModalTriggerClass } from './AppModal';

interface MidiClockModalProps {
    isPlaying: boolean;
    midiSupported: boolean;
    midiInitialized: boolean;
    syncMode: SyncMode;
    midiInputs: { id: string; name: string }[];
    midiOutputs: { id: string; name: string }[];
    selectedInputId: string | null;
    selectedOutputId: string | null;
    detectedBpm: number | null;
    selectInput: (id: string | null) => void;
    selectOutput: (id: string | null) => void;
    setSyncMode: (mode: SyncMode) => void;
    reinitAndRefresh: () => void;
}

const selectClass =
    'min-w-0 flex-1 cursor-pointer border border-white border-opacity-50 bg-black px-2 py-2 text-xs text-white outline-none disabled:cursor-not-allowed disabled:opacity-40';
const refreshButtonClass =
    'ml-auto cursor-pointer border border-white border-opacity-50 bg-black px-3 py-2 text-xs text-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black disabled:hover:text-white';

const modeButtonClass = (active: boolean, disabled: boolean) => {
    const stateClass = active
        ? 'bg-white text-black'
        : 'bg-black text-white hover:bg-white hover:text-black';
    const disabledClass = disabled
        ? 'cursor-not-allowed opacity-40 hover:bg-black hover:text-white'
        : 'cursor-pointer';

    return `flex-1 border border-white border-opacity-50 px-3 py-2 text-xs ${stateClass} ${disabledClass}`;
};

export function MidiClockModal({
    isPlaying,
    midiSupported,
    midiInitialized,
    syncMode,
    midiInputs,
    midiOutputs,
    selectedInputId,
    selectedOutputId,
    detectedBpm,
    selectInput,
    selectOutput,
    setSyncMode,
    reinitAndRefresh,
}: MidiClockModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const modeLocked = isPlaying;
    const modeTitle = modeLocked ? 'Stop playback before changing MIDI clock mode' : undefined;
    const openModal = useCallback(() => setIsOpen(true), []);
    const closeModal = useCallback(() => setIsOpen(false), []);

    return (
        <>
            <button
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                className={appModalTriggerClass}
                data-testid="midi-clock-trigger"
                onClick={openModal}
            >
                MIDI CLOCK
            </button>

            <AppModal isOpen={isOpen} onClose={closeModal} title="MIDI CLOCK" testId="midi-clock-modal">
                <div className="flex flex-col gap-3" data-testid="midi-clock-panel">
                    {!midiSupported && <p className="text-xs">MIDI NOT SUPPORTED</p>}

                    {midiSupported && !midiInitialized && (
                        <div className="flex items-center gap-3 border border-white border-opacity-50 p-2">
                            <p className="text-xs">MIDI UNAVAILABLE</p>
                            <button
                                type="button"
                                className={refreshButtonClass}
                                onClick={reinitAndRefresh}
                                title="Retry MIDI device access"
                            >
                                REFRESH
                            </button>
                        </div>
                    )}

                    {midiSupported && midiInitialized && (
                        <>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    className={modeButtonClass(syncMode === 'internal', modeLocked)}
                                    disabled={modeLocked}
                                    onClick={() => setSyncMode('internal')}
                                    title={modeTitle}
                                >
                                    INTERNAL
                                </button>
                                <button
                                    type="button"
                                    className={modeButtonClass(syncMode === 'follower', modeLocked)}
                                    disabled={modeLocked}
                                    onClick={() => setSyncMode('follower')}
                                    title={modeTitle}
                                >
                                    RECEIVE
                                </button>
                                <button
                                    type="button"
                                    className={modeButtonClass(syncMode === 'leader', modeLocked)}
                                    disabled={modeLocked}
                                    onClick={() => setSyncMode('leader')}
                                    title={modeTitle}
                                >
                                    SEND
                                </button>
                            </div>

                            {syncMode !== 'internal' && (
                                <div className="flex min-h-9 items-center gap-3 border-t border-white border-opacity-50 pt-3">
                                    {syncMode === 'follower' && (
                                        <select
                                            aria-label="MIDI clock input"
                                            className={selectClass}
                                            disabled={modeLocked}
                                            value={selectedInputId ?? ''}
                                            onChange={(event) => selectInput(event.target.value || null)}
                                        >
                                            <option value="">INPUT</option>
                                            {midiInputs.map((device) => (
                                                <option key={device.id} value={device.id}>{device.name}</option>
                                            ))}
                                        </select>
                                    )}

                                    {syncMode === 'leader' && (
                                        <select
                                            aria-label="MIDI clock output"
                                            className={selectClass}
                                            disabled={modeLocked}
                                            value={selectedOutputId ?? ''}
                                            onChange={(event) => selectOutput(event.target.value || null)}
                                        >
                                            <option value="">OUTPUT</option>
                                            {midiOutputs.map((device) => (
                                                <option key={device.id} value={device.id}>{device.name}</option>
                                            ))}
                                        </select>
                                    )}

                                    {syncMode === 'follower' && detectedBpm !== null && (
                                        <span className="shrink-0 text-xs">~{detectedBpm} BPM</span>
                                    )}

                                    <button
                                        type="button"
                                        className={refreshButtonClass}
                                        disabled={modeLocked}
                                        onClick={reinitAndRefresh}
                                        title="Refresh MIDI devices"
                                    >
                                        REFRESH
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </AppModal>
        </>
    );
}
