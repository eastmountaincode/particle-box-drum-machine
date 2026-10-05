import { DRUM_KIT_IDS, getDrumKit, getInstrumentForTrack, type DrumKitId } from './samples';

export const PRESETS_STORAGE_KEY = 'particle-box.presets.v1';
export const PRESET_NAME_MAX_LENGTH = 80;
export type CameraPosition = [number, number, number];

export interface TrackPreset {
    sampleId: string;
    steps: boolean[];
    volume: number;
    particleCount: number;
    lighting: boolean;
    quantization: boolean;
    freeze: boolean;
    mute: boolean;
    cameraPosition: CameraPosition | null;
}

export interface ParticlePreset {
    bpm: number;
    kitId: DrumKitId;
    globalVolume: number;
    reverb: { wet: number; decay: number; roomSize: number };
    tracks: TrackPreset[];
}

export interface SavedPreset {
    name: string;
    setup: ParticlePreset;
}

type PresetStorage = Pick<Storage, 'getItem' | 'setItem'>;
const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);
const inRange = (value: unknown, min: number, max: number): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

export function isParticlePreset(value: unknown): value is ParticlePreset {
    if (!isObject(value) || !inRange(value.bpm, 1, 300) ||
        !DRUM_KIT_IDS.includes(value.kitId as DrumKitId) || !inRange(value.globalVolume, 0, 1) ||
        !isObject(value.reverb) || !inRange(value.reverb.wet, 0, 1) ||
        !inRange(value.reverb.decay, 0.1, 10) || !inRange(value.reverb.roomSize, 0, 1) ||
        !Array.isArray(value.tracks) || value.tracks.length !== 4) return false;
    const kit = getDrumKit(value.kitId as DrumKitId);
    return value.tracks.every((track, index) => {
        if (!isObject(track) || !Array.isArray(track.steps) || track.steps.length !== 16 ||
            !track.steps.every(step => typeof step === 'boolean') ||
            !inRange(track.volume, 0, 1) || !inRange(track.particleCount, 0, 20) ||
            !Number.isInteger(track.particleCount) ||
            !['lighting', 'quantization', 'freeze', 'mute'].every(key => typeof track[key] === 'boolean') ||
            !kit.samples[getInstrumentForTrack(index)].some(sample => sample.id === track.sampleId)) return false;
        const position = track.cameraPosition;
        return position === null || (Array.isArray(position) && position.length === 3 &&
            position.every(coordinate => inRange(coordinate, -8, 8)) &&
            Math.hypot(...position) >= 1.5 && Math.hypot(...position) <= 8.001);
    });
}

export function samePresetName(first: string, second: string) {
    return first.trim().toLowerCase() === second.trim().toLowerCase();
}

export function readPresets(storage: PresetStorage): SavedPreset[] {
    let raw: string | null;
    try {
        raw = storage.getItem(PRESETS_STORAGE_KEY);
    } catch {
        throw new Error('Saved setups are unavailable. Allow storage for this site and try again.');
    }
    if (raw === null) return [];
    let data: unknown;
    try {
        data = JSON.parse(raw);
    } catch {
        throw new Error('Saved setups could not be read. Your stored data has not been changed.');
    }
    if (!isObject(data) || data.version !== 1 || !Array.isArray(data.presets)) {
        throw new Error('This saved setup format is not supported. Your stored data has not been changed.');
    }
    const names = new Set<string>();
    const presets: SavedPreset[] = [];
    for (const entry of data.presets) {
        if (!isObject(entry) || typeof entry.name !== 'string' || !entry.name.trim() ||
            entry.name.length > PRESET_NAME_MAX_LENGTH || !isParticlePreset(entry.setup) ||
            names.has(entry.name.trim().toLowerCase())) {
            throw new Error('A saved setup is invalid or its drum kit is unavailable. Your stored data has not been changed.');
        }
        names.add(entry.name.trim().toLowerCase());
        presets.push({ name: entry.name.trim(), setup: entry.setup });
    }
    return presets.sort((first, second) => first.name.localeCompare(second.name));
}

export function savePreset(storage: PresetStorage, name: string, setup: ParticlePreset, replace = false) {
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > PRESET_NAME_MAX_LENGTH) {
        throw new Error(`Enter a name between 1 and ${PRESET_NAME_MAX_LENGTH} characters.`);
    }
    if (!isParticlePreset(setup)) throw new Error('The current setup could not be saved.');
    const presets = readPresets(storage);
    const existing = presets.findIndex(preset => samePresetName(preset.name, trimmedName));
    if (existing >= 0 && !replace) {
        throw new Error('That name is already saved. Reopen Save / Load to replace it, or choose another name.');
    }
    const saved = { name: trimmedName, setup };
    if (existing < 0) presets.push(saved);
    else presets[existing] = saved;
    try {
        storage.setItem(PRESETS_STORAGE_KEY, JSON.stringify({ version: 1, presets }));
    } catch {
        throw new Error('Could not save. Browser storage may be full or unavailable; existing saves have not been changed.');
    }
    return trimmedName;
}

export function deletePreset(storage: PresetStorage, name: string) {
    const presets = readPresets(storage);
    const remaining = presets.filter(preset => !samePresetName(preset.name, name));
    if (remaining.length === presets.length) throw new Error("This setup is no longer available. Reopen Save / Load to refresh the list.");
    try {
        storage.setItem(PRESETS_STORAGE_KEY, JSON.stringify({ version: 1, presets: remaining }));
    } catch {
        throw new Error("Could not delete. Browser storage is unavailable; existing saves have not been changed.");
    }
    return remaining;
}
