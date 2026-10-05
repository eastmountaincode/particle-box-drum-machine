import { atom } from 'jotai';
import {
    selectedDrumKitIdAtom, globalVolumeAtom, reverbWetAtom, reverbDecayAtom, reverbRoomSizeAtom,
    getSequencerStepsAtom, getSampleIndexAtom, getTrackVolumeAtom, getParticleCountAtom,
    getLightingAtom, getQuantizationAtom, getFreezeAtom, getMuteAtom, getParticleCameraAtom,
    presetLoadRevisionAtom, currentStepAtom, isPlayingAtom,
} from './atoms';
import { getDrumKit, getInstrumentForTrack, getSample } from '../utils/samples';
import { isParticlePreset, type ParticlePreset } from '../utils/presets';

export const currentPresetSettingsAtom = atom(get => {
    const kitId = get(selectedDrumKitIdAtom);
    return {
        kitId,
        globalVolume: get(globalVolumeAtom),
        reverb: { wet: get(reverbWetAtom), decay: get(reverbDecayAtom), roomSize: get(reverbRoomSizeAtom) },
        tracks: Array.from({ length: 4 }, (_, index) => ({
            sampleId: getSample(kitId, getInstrumentForTrack(index), get(getSampleIndexAtom(index))).id,
            steps: [...get(getSequencerStepsAtom(index))],
            volume: get(getTrackVolumeAtom(index)),
            particleCount: get(getParticleCountAtom(index)),
            lighting: get(getLightingAtom(index)),
            quantization: get(getQuantizationAtom(index)),
            freeze: get(getFreezeAtom(index)),
            mute: get(getMuteAtom(index)),
            cameraPosition: get(getParticleCameraAtom(index)),
        })),
    };
});

export const loadPresetSettingsAtom = atom(null, (_get, set, preset: ParticlePreset) => {
    if (!isParticlePreset(preset)) throw new Error('The saved setup is invalid.');
    // One write transaction keeps kit selection and sample selections consistent.
    set(selectedDrumKitIdAtom, preset.kitId);
    set(globalVolumeAtom, preset.globalVolume);
    set(reverbWetAtom, preset.reverb.wet);
    set(reverbDecayAtom, preset.reverb.decay);
    set(reverbRoomSizeAtom, preset.reverb.roomSize);
    preset.tracks.forEach((track, index) => {
        const samples = getDrumKit(preset.kitId).samples[getInstrumentForTrack(index)];
        set(getSampleIndexAtom(index), samples.findIndex(sample => sample.id === track.sampleId));
        set(getSequencerStepsAtom(index), [...track.steps]);
        set(getTrackVolumeAtom(index), track.volume);
        set(getParticleCountAtom(index), track.particleCount);
        set(getLightingAtom(index), track.lighting);
        set(getQuantizationAtom(index), track.quantization);
        set(getFreezeAtom(index), track.freeze);
        set(getMuteAtom(index), track.mute);
        set(getParticleCameraAtom(index), track.cameraPosition ? [...track.cameraPosition] : null);
    });
    set(isPlayingAtom, false);
    set(currentStepAtom, 0);
    set(presetLoadRevisionAtom, revision => revision + 1);
});
