import type { MidiDeviceInfo } from './midiService';

export type StoredMidiClockMode = 'internal' | 'follower' | 'leader';

export interface MidiDevicePreference {
    id: string;
    name: string;
    manufacturer: string;
}

export interface MidiClockPreferences {
    mode: StoredMidiClockMode;
    input: MidiDevicePreference | null;
    output: MidiDevicePreference | null;
}

export const DEFAULT_MIDI_CLOCK_PREFERENCES: MidiClockPreferences = {
    mode: 'internal',
    input: null,
    output: null,
};

const MIDI_CLOCK_STORAGE_KEY = 'particle.midi-clock.v1';

function isClockMode(value: unknown): value is StoredMidiClockMode {
    return value === 'internal' || value === 'follower' || value === 'leader';
}

function parseDevicePreference(value: unknown): MidiDevicePreference | null {
    if (!value || typeof value !== 'object') return null;
    const candidate = value as Partial<MidiDevicePreference>;
    if (
        typeof candidate.id !== 'string'
        || typeof candidate.name !== 'string'
        || candidate.name.trim() === ''
        || typeof candidate.manufacturer !== 'string'
    ) {
        return null;
    }
    return {
        id: candidate.id,
        name: candidate.name,
        manufacturer: candidate.manufacturer,
    };
}

export function readMidiClockPreferences(
    storage: Pick<Storage, 'getItem'>,
): MidiClockPreferences {
    try {
        const stored = storage.getItem(MIDI_CLOCK_STORAGE_KEY);
        if (!stored) return { ...DEFAULT_MIDI_CLOCK_PREFERENCES };
        const parsed = JSON.parse(stored) as Partial<MidiClockPreferences>;
        return {
            mode: isClockMode(parsed.mode) ? parsed.mode : 'internal',
            input: parseDevicePreference(parsed.input),
            output: parseDevicePreference(parsed.output),
        };
    } catch {
        return { ...DEFAULT_MIDI_CLOCK_PREFERENCES };
    }
}

export function writeMidiClockPreferences(
    storage: Pick<Storage, 'setItem'>,
    preferences: MidiClockPreferences,
) {
    try {
        storage.setItem(MIDI_CLOCK_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
        // A disabled or full storage area should not prevent MIDI use.
    }
}

export function midiDevicePreference(device: MidiDeviceInfo): MidiDevicePreference {
    return {
        id: device.id,
        name: device.name,
        manufacturer: device.manufacturer,
    };
}

function normalized(value: string) {
    return value.trim().toLocaleLowerCase();
}

export function resolveMidiDevicePreference(
    devices: readonly MidiDeviceInfo[],
    preference: MidiDevicePreference | null,
) {
    if (!preference) return null;

    const exactId = devices.find(({ id }) => id === preference.id);
    if (exactId) return exactId;

    const preferredName = normalized(preference.name);
    const preferredManufacturer = normalized(preference.manufacturer);
    const exactIdentity = devices.find((device) => (
        normalized(device.name) === preferredName
        && normalized(device.manufacturer) === preferredManufacturer
    ));
    if (exactIdentity) return exactIdentity;

    return devices.find(({ name }) => normalized(name) === preferredName) ?? null;
}
