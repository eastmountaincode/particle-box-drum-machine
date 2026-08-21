'use client'

import { useCallback, useState } from 'react';
import { useAudioOutput } from '@/hooks/useAudioOutput';
import { drumAudioEngine } from '@/services/drumAudioEngine';
import type { AudioOutputChannel } from '@/services/audioOutput';
import { AppModal, appModalTriggerClass } from './AppModal';

const selectClass =
    'min-w-0 flex-1 cursor-pointer border border-white border-opacity-50 bg-black px-2 py-2 text-xs text-white outline-none disabled:cursor-not-allowed disabled:opacity-40';
const chooseButtonClass =
    'cursor-pointer border border-white border-opacity-50 bg-black px-3 py-2 text-xs text-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black disabled:hover:text-white';

export function AudioOutputModal() {
    const [isOpen, setIsOpen] = useState(false);
    const applyOutput = useCallback(
        (deviceId: string) => drumAudioEngine.setOutputDevice(deviceId),
        [],
    );
    const applyChannel = useCallback(
        (channel: AudioOutputChannel) => drumAudioEngine.setOutputChannel(channel),
        [],
    );
    const audioOutput = useAudioOutput(applyOutput, applyChannel);
    const openModal = useCallback(() => setIsOpen(true), []);
    const closeModal = useCallback(() => setIsOpen(false), []);

    if (!audioOutput.supported) return null;

    return (
        <>
            <button
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                className={appModalTriggerClass}
                data-testid="audio-output-trigger"
                onClick={openModal}
            >
                OUTPUT
            </button>

            <AppModal isOpen={isOpen} onClose={closeModal} title="AUDIO OUTPUT" testId="audio-output-modal">
                <div className="flex flex-col gap-3" data-testid="audio-output-panel">
                    <div className="flex items-center gap-3">
                        <label className="w-20 shrink-0 text-xs" htmlFor="audio-output">DEVICE</label>
                        <select
                            id="audio-output"
                            className={selectClass}
                            onChange={(event) => void audioOutput.select(event.target.value)}
                            value={audioOutput.selected.deviceId}
                        >
                            {audioOutput.outputs.map((output) => (
                                <option key={output.deviceId || 'default'} value={output.deviceId}>
                                    {output.label}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className={chooseButtonClass}
                            disabled={audioOutput.choosing}
                            onClick={() => void audioOutput.choose()}
                        >
                            {audioOutput.choosing ? 'CHOOSING…' : 'CHOOSE…'}
                        </button>
                    </div>

                    <div className="flex items-center gap-3 border-t border-white border-opacity-50 pt-3">
                        <label className="w-20 shrink-0 text-xs" htmlFor="audio-output-channel">CHANNEL</label>
                        <select
                            id="audio-output-channel"
                            className={selectClass}
                            onChange={(event) => void audioOutput.selectChannel(event.target.value as AudioOutputChannel)}
                            value={audioOutput.channel}
                        >
                            <option value="stereo">STEREO</option>
                            <option value="left">CHANNEL 1</option>
                            <option value="right">CHANNEL 2</option>
                        </select>
                    </div>

                    {audioOutput.error && (
                        <p className="text-xs" role="alert">{audioOutput.error}</p>
                    )}
                </div>
            </AppModal>
        </>
    );
}
