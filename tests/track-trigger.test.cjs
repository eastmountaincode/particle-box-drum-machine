const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

function loadTypeScript(file, dependencies) {
    const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(code, {
        exports: module.exports,
        module,
        require: (name) => dependencies[name],
        console,
    });
    return module.exports;
}

const timing = loadTypeScript('src/utils/triggerTiming.ts', {});
function setup() {
    const atoms = {
        isPlayingAtom: 'playing', syncModeAtom: 'sync', midiDetectedBpmAtom: 'bpm',
        getSequencerStepsAtom: (i) => `steps${i}`,
        getQuantizationAtom: (i) => `q${i}`,
        getFreezeAtom: (i) => `freeze${i}`,
        getMuteAtom: (i) => `mute${i}`,
    };
    const values = new Map([
        ['playing', true], ['sync', 'internal'], ['bpm', 120],
        ['steps0', Array(16).fill(false)], ['q0', true], ['freeze0', true], ['mute0', false],
    ]);
    const store = { get: (key) => values.get(key), set: (key, value) => values.set(key, value) };
    const tone = {
        context: { state: 'running' },
        immediate: () => 10,
        start: async () => {},
        Transport: { PPQ: 192, bpm: { value: 120 }, getTicksAtTime: () => 4.8 * 48 },
    };
    const plays = [];
    const { useTrackSamplePlayback } = loadTypeScript('src/hooks/useTrackSamplePlayback.ts', {
        react: { useCallback: (fn) => fn, useEffect: (fn) => fn(), useRef: (value) => ({ current: value }) },
        jotai: { useStore: () => store, useAtomValue: (key) => store.get(key) },
        tone,
        '@/store/atoms': atoms,
        '@/utils/triggerTiming': timing,
    });
    return {
        values, tone, plays,
        hook: useTrackSamplePlayback(0, (...args) => plays.push(args)),
    };
}

test('tap sounds immediately, adds nearest step, and preserves existing hits', () => {
    const s = setup();
    s.values.get('steps0')[2] = true;
    s.hook.trigger();
    assert.deepEqual(s.plays, [[1, 10]]);
    assert.equal(s.values.get('steps0')[5], true);
    assert.equal(s.values.get('steps0')[2], true);
    assert.equal(s.values.get('steps0').filter(Boolean).length, 2);
});

test('a newly added future hit does not double, then plays on the next loop', () => {
    const s = setup();
    s.hook.trigger();
    s.hook.onStepTriggered(5, 10.025);
    assert.equal(s.plays.length, 1);
    s.hook.onStepTriggered(5, 12.025);
    assert.equal(s.plays.length, 2);
});

test('nearest step wraps from the end of the bar to step one', () => {
    const s = setup();
    s.tone.Transport.getTicksAtTime = () => 15.8 * 48;
    s.hook.trigger();
    assert.equal(s.values.get('steps0')[0], true);
});

for (const [name, key, value] of [
    ['stopped', 'playing', false], ['unfrozen', 'freeze0', false], ['unquantized', 'q0', false],
]) {
    test(`${name} trigger auditions without editing the pattern`, () => {
        const s = setup();
        s.values.set(key, value);
        s.hook.trigger();
        assert.equal(s.plays.length, 1);
        assert.equal(s.values.get('steps0').some(Boolean), false);
    });
}

test('mute silences audition and playback while retaining the inserted step', () => {
    const s = setup();
    s.values.set('mute0', true);
    s.hook.trigger();
    s.hook.onStepTriggered(5, 12.025);
    assert.equal(s.plays.length, 0);
    assert.equal(s.values.get('steps0')[5], true);
});

test('repeated taps add a step without toggling it off', () => {
    const s = setup();
    s.hook.trigger();
    s.hook.trigger();
    assert.equal(s.values.get('steps0').filter(Boolean).length, 1);
    assert.equal(s.plays.length, 2);
});

test('external clock uses received timing instead of local transport', () => {
    const s = setup();
    s.values.set('sync', 'follower');
    s.hook.onStepTriggered(9, 9.9);
    s.hook.trigger();
    assert.equal(s.values.get('steps0')[10], true);
    assert.equal(s.values.get('steps0')[5], false);
});

test('external clock does not invent a position before receiving a step', () => {
    const s = setup();
    s.values.set('sync', 'follower');
    s.hook.trigger();
    assert.equal(s.plays.length, 1);
    assert.equal(s.values.get('steps0').some(Boolean), false);
});

test('external clock can infer tempo from successive steps before BPM is known', () => {
    const s = setup();
    s.values.set('sync', 'follower');
    s.values.set('bpm', null);
    s.hook.onStepTriggered(8, 9.775);
    s.hook.onStepTriggered(9, 9.9);
    s.hook.trigger();
    assert.equal(s.values.get('steps0')[10], true);
});

test('look-ahead timing quantizes backward correctly across a bar boundary', () => {
    const target = timing.nearestTriggerStep({ step: 0, time: 10.1 }, 10, 0.125);
    assert.equal(target.step, 15);
    assert.equal(target.time, 9.975);
});

test('playback reads new steps immediately without waiting for a React render', () => {
    const s = setup();
    s.values.get('steps0')[7] = true;
    s.hook.onStepTriggered(7, 11);
    assert.deepEqual(s.plays, [[1, 11]]);
});
