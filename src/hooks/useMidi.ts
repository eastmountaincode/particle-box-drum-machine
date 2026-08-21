'use client'

import { useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import { midiService } from '@/services/midiService';
import { midiClockManager } from '@/services/midiClockManager';
import {
    midiSupportedAtom,
    midiInitializedAtom,
    syncModeAtom,
    midiInputsAtom,
    midiOutputsAtom,
    selectedMidiInputIdAtom,
    selectedMidiOutputIdAtom,
    midiDetectedBpmAtom,
    type SyncMode,
} from '@/store/atoms';

interface AudioEngineCallbacks {
    prepareExternalClock: () => Promise<void>;
    handleExternalStep: (step: number) => void;
    handleExternalStart: () => void;
    handleExternalContinue: () => void;
    handleExternalStop: () => void;
}

export const useMidi = (audioEngine: AudioEngineCallbacks) => {
    const { prepareExternalClock } = audioEngine;
    const [midiSupported, setMidiSupported] = useAtom(midiSupportedAtom);
    const [midiInitialized, setMidiInitialized] = useAtom(midiInitializedAtom);
    const [syncMode, setSyncModeAtom] = useAtom(syncModeAtom);
    const [midiInputs, setMidiInputs] = useAtom(midiInputsAtom);
    const [midiOutputs, setMidiOutputs] = useAtom(midiOutputsAtom);
    const [selectedInputId, setSelectedInputId] = useAtom(selectedMidiInputIdAtom);
    const [selectedOutputId, setSelectedOutputId] = useAtom(selectedMidiOutputIdAtom);
    const [detectedBpm, setDetectedBpm] = useAtom(midiDetectedBpmAtom);

    const refreshDevices = useCallback(() => {
        setMidiInputs(midiService.getInputs().map(d => ({ id: d.id, name: d.name })));
        setMidiOutputs(midiService.getOutputs().map(d => ({ id: d.id, name: d.name })));
    }, [setMidiInputs, setMidiOutputs]);

    // Wire midiClockManager callbacks to audio engine
    useEffect(() => {
        midiClockManager.setCallbacks({
            onExternalStep: audioEngine.handleExternalStep,
            onExternalStart: audioEngine.handleExternalStart,
            onExternalContinue: audioEngine.handleExternalContinue,
            onExternalStop: audioEngine.handleExternalStop,
            onDetectedBpmChange: (bpm: number) => setDetectedBpm(bpm),
        });

        return () => {
            midiClockManager.setCallbacks(null);
        };
    }, [audioEngine.handleExternalStep, audioEngine.handleExternalStart, audioEngine.handleExternalContinue, audioEngine.handleExternalStop, setDetectedBpm]);

    // Initialize Web MIDI on mount
    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            const supported = midiService.isSupported();
            if (cancelled) return;
            setMidiSupported(supported);
            setMidiInitialized(false);

            if (supported) {
                const success = await midiService.initialize();
                if (cancelled) return;
                setMidiInitialized(success);
                if (success) {
                    refreshDevices();
                }
            }
        };
        init();

        midiService.onDeviceChange(refreshDevices);

        return () => {
            cancelled = true;
            midiService.onDeviceChange(null);
            midiService.destroy();
        };
    }, [refreshDevices, setMidiInitialized, setMidiSupported]);

    const selectInput = useCallback((deviceId: string | null) => {
        if (deviceId) {
            midiService.selectInput(deviceId);
        } else {
            midiService.clearInput();
        }
        setSelectedInputId(deviceId);
    }, [setSelectedInputId]);

    const selectOutput = useCallback((deviceId: string | null) => {
        if (deviceId) {
            midiService.selectOutput(deviceId);
        } else {
            midiService.clearOutput();
        }
        setSelectedOutputId(deviceId);
    }, [setSelectedOutputId]);

    const setSyncMode = useCallback((mode: SyncMode) => {
        if (mode === 'follower') {
            void prepareExternalClock();
        }
        midiClockManager.setSyncMode(mode);
        setSyncModeAtom(mode);
        if (mode !== 'follower') {
            setDetectedBpm(null);
        }
    }, [prepareExternalClock, setSyncModeAtom, setDetectedBpm]);

    const reinitAndRefresh = useCallback(async () => {
        const success = await midiService.reinitialize();
        setMidiInitialized(success);
        setSelectedInputId(null);
        setSelectedOutputId(null);
        if (success) {
            refreshDevices();
        }
    }, [setMidiInitialized, setSelectedInputId, setSelectedOutputId, refreshDevices]);

    return {
        // MIDI state
        midiSupported,
        midiInitialized,
        syncMode,
        midiInputs,
        midiOutputs,
        selectedInputId,
        selectedOutputId,
        detectedBpm,
        // MIDI actions
        selectInput,
        selectOutput,
        setSyncMode,
        reinitAndRefresh,
    };
};
