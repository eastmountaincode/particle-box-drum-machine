const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function eventTarget() {
  const handlers = new Map();
  return {
    addEventListener(type, fn) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(fn);
    },
    removeEventListener(type, fn) { handlers.get(type)?.delete(fn); },
    emit(type, event = {}) { handlers.get(type)?.forEach(fn => fn(event)); },
  };
}

function load(file, dependencies, globals = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports, require: name => dependencies[name], console, ...globals,
  });
  return module.exports;
}

function setup(mode = 'internal') {
  const window = eventTarget();
  const document = { ...eventTarget(), visibilityState: 'visible', hasFocus: () => true };
  const rawContext = eventTarget();
  const effects = [];
  const calls = [];
  const frames = [];
  const sequences = [];
  const clocks = [];
  let resume = () => Promise.resolve();
  class Context {
    state = 'running';
    rawContext = rawContext;
    clockSource = 'worker';
    async close() { calls.push('context-close'); this.state = 'closed'; }
  }
  const context = new Context();
  class Clock {
    state = 'stopped';
    constructor(callback) { this.callback = callback; clocks.push(this); }
    start() { this.state = 'started'; }
    stop() { this.state = 'stopped'; }
    dispose() { this.state = 'disposed'; }
  }
  class Sequence extends Clock {
    constructor(callback) { super(callback); sequences.push(this); }
  }
  class Gain { toDestination() { return this; } dispose() { calls.push('gain-dispose'); } }
  class Oscillator extends Clock {
    connect() { return this; }
    dispose() { super.dispose(); calls.push('oscillator-dispose'); }
  }
  const Transport = {
    state: 'stopped', PPQ: 192, ticks: 0, bpm: { value: 120 },
    start() { this.state = 'started'; },
    stop() { this.state = 'stopped'; calls.push('transport-stop'); },
    cancel() { calls.push('transport-cancel'); },
    clear() {},
    scheduleRepeat(callback) { this.tick = callback; return 1; },
  };
  const Tone = {
    Context, Clock, Sequence, Gain, Oscillator, Transport, context,
    getContext: () => context, immediate: () => 10,
    start: () => { calls.push('resume'); return resume(); },
    Draw: { schedule: callback => frames.push(callback), cancel: () => { frames.length = 0; } },
  };
  const stateUpdates = [];
  const react = {
    useState: initial => [initial, value => stateUpdates.push(value)],
    useRef: current => ({ current }), useCallback: callback => callback,
    useEffect: callback => effects.push(callback),
  };
  const midiClockManager = {
    onInternalStart: () => calls.push('midi-start'),
    onInternalStop: () => calls.push('midi-stop'),
    onInternalTick: () => calls.push('midi-clock'),
  };
  const backgroundParticleClock = { tick: () => calls.push('particle-tick') };
  const { useAudioEngine } = load('src/hooks/useAudioEngine.ts', {
    react, jotai: { useAtom: () => [0, value => stateUpdates.push(value)], useAtomValue: () => mode },
    tone: Tone, '@/store/atoms': {}, '@/services/midiClockManager': { midiClockManager },
    '@/services/backgroundParticleClock': {
      backgroundParticleClock, isPageBackgrounded: () => document.visibilityState === 'hidden',
    },
  }, { window, document, navigator: { mediaSession: {} }, performance: { now: () => 1000 } });
  const engine = useAudioEngine(120);
  const cleanups = effects.map(callback => callback()).filter(Boolean);
  return { window, document, rawContext, engine, context, calls, clocks, sequences, frames,
    Transport, stateUpdates, cleanups, setResume: fn => { resume = fn; } };
}

test('closing a playing page releases clocks and audio without restarting', async () => {
  const s = setup();
  await s.engine.start();
  s.sequences[0].callback(10, 4);
  assert.equal(s.frames.length, 1);
  s.window.emit('pagehide', { persisted: false });
  assert.equal(s.Transport.state, 'stopped');
  assert.equal(s.context.clockSource, 'offline');
  assert.equal(s.context.state, 'closed');
  assert.ok(s.clocks.every(clock => clock.state === 'disposed'));
  assert.equal(s.frames.length, 0, 'queued visual updates are discarded');
  const before = s.calls.length;
  s.context.state = 'suspended';
  s.rawContext.emit('statechange');
  s.window.emit('focus');
  s.window.emit('pointerdown');
  assert.equal(s.calls.length, before, 'recovery handlers cannot fight shutdown');
  s.window.emit('pagehide', { persisted: false });
  assert.equal(s.calls.filter(call => call === 'context-close').length, 1, 'shutdown is idempotent');
});

test('a pending Play request cannot restart a page after close', async () => {
  const s = setup();
  s.context.state = 'suspended';
  let resolve;
  s.setResume(() => new Promise(done => { resolve = done; }));
  const starting = s.engine.start();
  s.window.emit('pagehide', { persisted: false });
  resolve();
  await starting;
  assert.equal(s.Transport.state, 'stopped');
  assert.ok(s.clocks.every(clock => clock.state === 'disposed'));
  assert.ok(!s.stateUpdates.includes(true), 'late resume does not publish Playing');
});

test('leader shutdown sends Stop once and ignores queued MIDI clock ticks', async () => {
  const s = setup('leader');
  await s.engine.start();
  s.window.emit('pagehide', { persisted: false });
  s.Transport.tick(10);
  s.cleanups.forEach(cleanup => cleanup());
  assert.equal(s.calls.filter(call => call === 'midi-stop').length, 1);
  assert.equal(s.calls.filter(call => call === 'midi-clock').length, 0);
});

test('external MIDI cannot restart a closing follower', async () => {
  const s = setup('follower');
  s.engine.handleExternalStart();
  s.window.emit('pagehide', { persisted: false });
  const before = s.clocks.length;
  s.engine.handleExternalStart();
  s.engine.handleExternalContinue();
  await s.engine.prepareExternalClock();
  assert.equal(s.clocks.length, before);
  assert.equal(s.context.state, 'closed');
});

test('backgrounding and back-forward caching retain the running instrument', async () => {
  const s = setup();
  await s.engine.start();
  s.document.visibilityState = 'hidden';
  s.document.emit('visibilitychange');
  s.window.emit('blur');
  s.window.emit('pagehide', { persisted: true });
  assert.equal(s.Transport.state, 'started');
  assert.equal(s.context.state, 'running');
  assert.equal(s.context.clockSource, 'worker');
});

test('React unmount stops playback without closing the shared audio context', async () => {
  const s = setup();
  await s.engine.start();
  s.cleanups.forEach(cleanup => cleanup());
  assert.equal(s.Transport.state, 'stopped');
  assert.equal(s.context.state, 'running');
});

test('destroying MIDI invalidates an unfinished device initialization', async () => {
  let resolve;
  const access = { inputs: new Map(), outputs: new Map(), onstatechange: null };
  const { MidiService } = load('src/services/midiService.ts', {}, {
    navigator: { requestMIDIAccess: () => new Promise(done => { resolve = done; }) },
  });
  const service = new MidiService();
  const pending = service.initialize();
  service.destroy();
  resolve(access);
  assert.equal(await pending, false);
  assert.equal(access.onstatechange, null);
});

test('final page close detaches MIDI without relying on React unmount', () => {
  const window = eventTarget();
  const effects = [];
  let destroyed = 0;
  let callbacks;
  const { useMidi } = load('src/hooks/useMidi.ts', {
    react: {
      useRef: current => ({ current }), useCallback: fn => fn,
      useEffect: fn => effects.push(fn),
    },
    jotai: { useAtom: () => [null, () => {}] },
    '@/store/atoms': {},
    '@/services/midiService': { midiService: {
      isSupported: () => false, onDeviceChange: () => {}, destroy: () => destroyed++,
    } },
    '@/services/midiClockManager': { midiClockManager: {
      setSyncMode: () => {}, setCallbacks: next => { callbacks = next; },
    } },
    '@/services/midiClockPreferences': { readMidiClockPreferences: () => ({ mode: 'internal' }) },
  }, { window });
  useMidi({});
  const cleanups = effects.map(fn => fn());
  window.emit('pagehide', { persisted: true });
  assert.equal(destroyed, 0, 'a cached page retains its MIDI session');
  window.emit('pagehide', { persisted: false });
  assert.equal(destroyed, 1);
  assert.equal(callbacks, null);
  cleanups.forEach(fn => fn?.());
  const afterUnmount = destroyed;
  window.emit('pagehide', { persisted: false });
  assert.equal(destroyed, afterUnmount, 'unmount removes the close listener');
});
