'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useStore } from 'jotai';
import { AppModal, appModalTriggerClass } from './AppModal';
import { currentPresetSettingsAtom, loadPresetSettingsAtom } from '@/store/presets';
import { PRESET_NAME_MAX_LENGTH, deletePreset, readPresets, samePresetName, savePreset, type SavedPreset } from '@/utils/presets';

export function PresetsModal({ bpm, onBpmChange, onBeforeLoad }: {
    bpm: number;
    onBpmChange: (bpm: number) => void;
    onBeforeLoad: () => void;
}) {
    const store = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [selectedName, setSelectedName] = useState('');
    const [presets, setPresets] = useState<SavedPreset[]>([]);
    const [storageReady, setStorageReady] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState<{ message: string } | null>(null);
    useEffect(() => {
        if (!status) return;
        const timer = window.setTimeout(() => setStatus(null), 3000);
        return () => window.clearTimeout(timer);
    }, [status]);
    const close = useCallback(() => setIsOpen(false), []);
    const replacing = presets.some(preset => samePresetName(preset.name, name));

    const open = () => {
        setError('');
        setStatus(null);
        try {
            const saved = readPresets(window.localStorage);
            setPresets(saved);
            setSelectedName(saved.find(preset => samePresetName(preset.name, name))?.name ?? saved[0]?.name ?? '');
            setStorageReady(true);
        } catch (cause) {
            setPresets([]);
            setStorageReady(false);
            setError(cause instanceof Error ? cause.message : 'Browser storage is unavailable.');
        }
        setIsOpen(true);
    };

    const save = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setStatus(null);
        try {
            const savedName = savePreset(window.localStorage, name, {
                ...store.get(currentPresetSettingsAtom), bpm,
            }, replacing);
            setName(savedName);
            setPresets(readPresets(window.localStorage));
            setSelectedName(savedName);
            setStatus({ message: `Saved “${savedName}”.` });
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Browser storage is unavailable.');
        }
    };

    const load = () => {
        setError('');
        setStatus(null);
        try {
            const saved = readPresets(window.localStorage).find(preset => preset.name === selectedName);
            if (!saved) throw new Error('This setup is no longer available. Reopen Save / Load to refresh the list.');
            onBeforeLoad();
            store.set(loadPresetSettingsAtom, saved.setup);
            onBpmChange(saved.setup.bpm);
            setName(saved.name);
            setStatus({ message: `Loaded “${saved.name}”.` });
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Could not load this setup.');
        }
    };

    const remove = () => {
        setError('');
        setStatus(null);
        try {
            const remaining = deletePreset(window.localStorage, selectedName);
            setPresets(remaining);
            setSelectedName(remaining[0]?.name ?? '');
            if (samePresetName(name, selectedName)) setName('');
            setStatus({ message: `Deleted “${selectedName}”.` });
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Could not delete this setup.');
        }
    };

    return (
        <>
            <button type="button" className={appModalTriggerClass} aria-haspopup="dialog" aria-expanded={isOpen} onClick={open}>
                SAVE / LOAD
            </button>
            <AppModal isOpen={isOpen} onClose={close} title="SAVE / LOAD" testId="presets-modal">
                <div className="flex flex-col gap-4 whitespace-normal text-xs">
                    <form onSubmit={save} className="flex flex-col gap-2">
                        <label className="flex flex-col gap-2">
                            NAME
                            <input
                                required maxLength={PRESET_NAME_MAX_LENGTH} value={name}
                                onChange={event => setName(event.target.value)}
                                className="w-full border border-white bg-black p-2 text-white"
                            />
                        </label>
                        {replacing ? <p>A setup with this name exists. Replace will overwrite it.</p> : null}
                        <button type="submit" className={`${appModalTriggerClass} disabled:opacity-40`} disabled={!storageReady || !name.trim()}>
                            {replacing ? 'REPLACE' : 'SAVE'}
                        </button>
                    </form>
                    {presets.length > 0 ? (
                        <label className="flex flex-col gap-2">
                            SAVED SETUPS
                            <select
                                size={6} value={selectedName}
                                onChange={event => {
                                    setSelectedName(event.target.value);
                                    setName(event.target.value);
                                }}
                                className="w-full border border-white bg-black p-2 text-white"
                            >
                                {presets.map(preset => <option key={preset.name} value={preset.name}>{preset.name}</option>)}
                            </select>
                        </label>
                    ) : storageReady ? <p>No saved setups yet.</p> : null}
                    <div className="flex gap-2">
                        <button type="button" className={`${appModalTriggerClass} flex-1 disabled:opacity-40`} disabled={!storageReady || !selectedName} onClick={load}>
                            LOAD
                        </button>
                        <button type="button" className={`${appModalTriggerClass} flex-1 disabled:opacity-40`} disabled={!storageReady || !selectedName} onClick={remove}>
                            DELETE
                        </button>
                    </div>
                    <p>Saved in this browser on this device. Loading stops playback.</p>
                    <p role="status">{status?.message}</p>
                    {error ? <p role="alert" className="text-red-300">{error}</p> : null}
                </div>
            </AppModal>
        </>
    );
}
