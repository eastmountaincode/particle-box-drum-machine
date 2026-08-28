'use client'

import { useEffect, useCallback, useRef } from 'react';
import { useAtom } from 'jotai';
import { midiService } from '@/services/midiService';
import { midiClockManager } from '@/services/midiClockManager';
import {
    DEFAULT_MIDI_CLOCK_PREFERENCES,
    midiDevicePreference,
    readMidiClockPreferences,
    resolveMidiDevicePreference,
    writeMidiClockPreferences,
    type MidiClockPreferences,
} from '@/services/midiClockPreferences';
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
    const preferencesRef = useRef<MidiClockPreferences | null>(null);
    const selectedInputIdRef = useRef<string | null>(selectedInputId);
    const selectedOutputIdRef = useRef<string | null>(selectedOutputId);

    const applyInputSelection = useCallback((deviceId: string | null) => {
        if (deviceId) {
            midiService.selectInput(deviceId);
        } else {
            midiService.clearInput();
        }
        selectedInputIdRef.current = deviceId;
        setSelectedInputId(deviceId);
    }, [setSelectedInputId]);

    const applyOutputSelection = useCallback((deviceId: string | null) => {
        if (deviceId) {
            midiService.selectOutput(deviceId);
        } else {
            midiService.clearOutput();
        }
        selectedOutputIdRef.current = deviceId;
        setSelectedOutputId(deviceId);
    }, [setSelectedOutputId]);

    const savePreferences = useCallback((
        update: (current: MidiClockPreferences) => MidiClockPreferences,
    ) => {
        const current = preferencesRef.current ?? DEFAULT_MIDI_CLOCK_PREFERENCES;
        const next = update(current);
        preferencesRef.current = next;
        writeMidiClockPreferences(window.localStorage, next);
    }, []);

    const refreshDevices = useCallback(() => {
        const inputs = midiService.getInputs();
        const outputs = midiService.getOutputs();
        setMidiInputs(inputs.map(d => ({ id: d.id, name: d.name })));
        setMidiOutputs(outputs.map(d => ({ id: d.id, name: d.name })));

        const preferences = preferencesRef.current;
        if (!preferences) return;

        const preferredInput = resolveMidiDevicePreference(inputs, preferences.input);
        const nextInputId = preferredInput?.id ?? null;
        if (nextInputId !== selectedInputIdRef.current) {
            applyInputSelection(nextInputId);
        }

        const preferredOutput = resolveMidiDevicePreference(outputs, preferences.output);
        const nextOutputId = preferredOutput?.id ?? null;
        if (nextOutputId !== selectedOutputIdRef.current) {
            applyOutputSelection(nextOutputId);
        }
    }, [applyInputSelection, applyOutputSelection, setMidiInputs, setMidiOutputs]);

    // Wire midiClockManager callbacks to audio engine
    useEffect(() => {
        midiClockManager.setCallbacks({
            onExternalStep: audioEngine.handleExternalStep,
            onExternalStart: audioEngine.handleExternalStart,
            onExternalContinue: audioEngine.handleExternalContinue,
            onExternalStop: audioEngine.handleExternalStop,
            onDetectedBpmChange: (bpm: number | null) => setDetectedBpm(bpm),
        });

        return () => {
            midiClockManager.setCallbacks(null);
        };
    }, [audioEngine.handleExternalStep, audioEngine.handleExternalStart, audioEngine.handleExternalContinue, audioEngine.handleExternalStop, setDetectedBpm]);

    // Initialize Web MIDI on mount
    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            const preferences = readMidiClockPreferences(window.localStorage);
            preferencesRef.current = preferences;
            midiClockManager.setSyncMode(preferences.mode);
            setSyncModeAtom(preferences.mode);
            if (preferences.mode === 'follower') {
                void prepareExternalClock();
            }

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
    }, [prepareExternalClock, refreshDevices, setMidiInitialized, setMidiSupported, setSyncModeAtom]);

    const selectInput = useCallback((deviceId: string | null) => {
        applyInputSelection(deviceId);
        const device = deviceId
            ? midiService.getInputs().find(({ id }) => id === deviceId) ?? null
            : null;
        savePreferences((current) => ({
            ...current,
            input: device ? midiDevicePreference(device) : null,
        }));
    }, [applyInputSelection, savePreferences]);

    const selectOutput = useCallback((deviceId: string | null) => {
        applyOutputSelection(deviceId);
        const device = deviceId
            ? midiService.getOutputs().find(({ id }) => id === deviceId) ?? null
            : null;
        savePreferences((current) => ({
            ...current,
            output: device ? midiDevicePreference(device) : null,
        }));
    }, [applyOutputSelection, savePreferences]);

    const setSyncMode = useCallback((mode: SyncMode) => {
        if (mode === 'follower') {
            void prepareExternalClock();
        }
        midiClockManager.setSyncMode(mode);
        setSyncModeAtom(mode);
        savePreferences((current) => ({ ...current, mode }));
        if (mode !== 'follower') {
            setDetectedBpm(null);
        }
    }, [prepareExternalClock, savePreferences, setSyncModeAtom, setDetectedBpm]);

    const reinitAndRefresh = useCallback(async () => {
        const success = await midiService.reinitialize();
        setMidiInitialized(success);
        selectedInputIdRef.current = null;
        selectedOutputIdRef.current = null;
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
