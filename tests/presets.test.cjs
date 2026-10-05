const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createStore } = require('jotai/vanilla');

function load(file, dependencies = {}) {
    const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const module = { exports: {} };
    new Function('require', 'module', 'exports', code)(name => dependencies[name] ?? require(name), module, module.exports);
    return module.exports;
}

const samples = load('src/utils/samples.ts');
const presets = load('src/utils/presets.ts', { './samples': samples });
const atoms = load('src/store/atoms.ts', { '@/utils/samples': samples });
const presetAtoms = load('src/store/presets.ts', {
    './atoms': atoms, '../utils/samples': samples, '../utils/presets': presets,
});
const { readPresets, savePreset, deletePreset, PRESETS_STORAGE_KEY } = presets;

function memoryStorage() {
    const data = new Map();
    return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

function setup(kitId = 'dmx') {
    return {
        bpm: 135,
        kitId,
        globalVolume: 0.55,
        reverb: { wet: 0.6, decay: 2.5, roomSize: 0.7 },
        tracks: Array.from({ length: 4 }, (_, index) => ({
            sampleId: samples.getDrumKit(kitId).samples[samples.getInstrumentForTrack(index)].at(-1).id,
            steps: Array.from({ length: 16 }, (_, step) => step === index || step === 15),
            volume: 0.2 + index * 0.15,
            particleCount: index,
            lighting: index % 2 === 0,
            quantization: index !== 1,
            freeze: index !== 2,
            mute: index === 3,
            cameraPosition: [4, index - 2, 4],
        })),
    };
}

test('named saves persist all four patterns, kit, track controls, camera angles, and reverb', () => {
    const storage = memoryStorage();
    assert.deepEqual(readPresets(storage), []);
    assert.equal(savePreset(storage, '  Night  ', setup()), 'Night');
    assert.deepEqual(readPresets(storage), [{ name: 'Night', setup: setup() }]);
});

test('loading restores every control atom together and leaves playback stopped', () => {
    const store = createStore();
    store.set(atoms.isPlayingAtom, true);
    store.set(atoms.currentStepAtom, 7);
    const saved = setup();
    store.set(presetAtoms.loadPresetSettingsAtom, saved);
    const { bpm: ignoredBpm, ...expected } = saved;
    assert.equal(ignoredBpm, 135);
    assert.deepEqual(store.get(presetAtoms.currentPresetSettingsAtom), expected);
    assert.equal(store.get(atoms.isPlayingAtom), false);
    assert.equal(store.get(atoms.currentStepAtom), 0);
    assert.equal(store.get(atoms.presetLoadRevisionAtom), 1);
    saved.tracks[0].steps[0] = false;
    saved.tracks[0].cameraPosition[0] = 2;
    assert.equal(store.get(atoms.getSequencerStepsAtom(0))[0], true);
    assert.equal(store.get(atoms.getParticleCameraAtom(0))[0], 4);
});

test('all available kits round-trip with their last sample on every track', () => {
    const store = createStore();
    for (const kitId of samples.DRUM_KIT_IDS) {
        const saved = setup(kitId);
        store.set(presetAtoms.loadPresetSettingsAtom, saved);
        assert.equal(store.get(atoms.selectedDrumKitIdAtom), kitId);
        for (let index = 0; index < 4; index++) {
            assert.equal(store.get(atoms.getSampleIndexAtom(index)), samples.getSampleCount(kitId, samples.getInstrumentForTrack(index)) - 1);
        }
    }
});

test('replacement is explicit, case insensitive, and retains other saves', () => {
    const storage = memoryStorage();
    savePreset(storage, 'Zulu', setup());
    savePreset(storage, 'Alpha', setup());
    assert.throws(() => savePreset(storage, 'zulu', setup()), /already saved/);
    savePreset(storage, 'Zulu', { ...setup(), bpm: 90 }, true);
    assert.deepEqual(readPresets(storage).map(preset => preset.name), ['Alpha', 'Zulu']);
    assert.equal(readPresets(storage)[1].setup.bpm, 90);
});

test('delete removes only the selected setup, includes latest saves, and persists the empty list', () => {
    const storage = memoryStorage();
    savePreset(storage, 'First', setup());
    savePreset(storage, 'Second', setup());
    assert.deepEqual(deletePreset(storage, 'first').map(preset => preset.name), ['Second']);
    assert.deepEqual(readPresets(storage).map(preset => preset.name), ['Second']);
    deletePreset(storage, 'Second');
    assert.deepEqual(readPresets(storage), []);
    assert.throws(() => deletePreset(storage, 'Missing'), /no longer available/);
});

test('corrupt or unsupported storage is preserved on save and delete', () => {
    const storage = memoryStorage();
    for (const raw of ['broken', JSON.stringify({ version: 9, presets: [] })]) {
        storage.setItem(PRESETS_STORAGE_KEY, raw);
        assert.throws(() => savePreset(storage, 'New', setup()));
        assert.throws(() => deletePreset(storage, 'New'));
        assert.equal(storage.getItem(PRESETS_STORAGE_KEY), raw);
    }
});

test('rejects unavailable samples, invalid patterns, volumes, counts, and camera positions before loading', () => {
    const store = createStore();
    const before = store.get(presetAtoms.currentPresetSettingsAtom);
    for (const change of [
        s => { s.kitId = 'missing'; },
        s => { s.tracks[0].sampleId = 'missing'; },
        s => { s.tracks[0].steps = [true]; },
        s => { s.tracks[0].steps[0] = 'true'; },
        s => { s.tracks[0].volume = 2; },
        s => { s.tracks[0].particleCount = 21; },
        s => { s.tracks[0].cameraPosition = [0, 0, 0]; },
        s => { s.tracks[0].cameraPosition = [NaN, 4, 4]; },
        s => { s.reverb.decay = -1; },
    ]) {
        const invalid = setup();
        change(invalid);
        assert.throws(() => store.set(presetAtoms.loadPresetSettingsAtom, invalid), /invalid/);
        assert.deepEqual(store.get(presetAtoms.currentPresetSettingsAtom), before);
    }
});

test('quota and denied-storage failures leave existing saves intact', () => {
    const storage = memoryStorage();
    savePreset(storage, 'Original', setup());
    const before = storage.getItem(PRESETS_STORAGE_KEY);
    const failing = { ...storage, setItem: () => { throw Error('quota'); } };
    assert.throws(() => savePreset(failing, 'New', setup()), /Could not save/);
    assert.throws(() => deletePreset(failing, 'Original'), /Could not delete/);
    assert.equal(storage.getItem(PRESETS_STORAGE_KEY), before);
    assert.throws(() => readPresets({ getItem: () => { throw Error('denied'); } }), /unavailable/);
});
