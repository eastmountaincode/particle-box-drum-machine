const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function setup(visibilityState, focused) {
  const document = { visibilityState, hasFocus: () => focused };
  const timers = new Map();
  const states = [];
  const cleanups = [];
  const hits = [];
  let timerId = 0;
  const react = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState: (initial) => {
      const slot = states.length;
      states.push(initial);
      return [initial, (update) => {
        states[slot] = typeof update === 'function' ? update(states[slot]) : update;
      }];
    },
    useRef: (current) => ({ current }),
    useCallback: (fn) => fn,
    useEffect: (fn) => cleanups.push(fn()),
  };
  function load(file, dependencies = {}) {
    const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
    }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(source, {
      module, exports: module.exports, document,
      require: (name) => dependencies[name],
      setTimeout: (fn) => { timers.set(++timerId, fn); return timerId; },
      clearTimeout: (id) => timers.delete(id),
    });
    return module.exports;
  }
  const clock = load('src/services/backgroundParticleClock.ts');
  const { ParticleBox } = load('src/components/ParticleBox.tsx', {
    react,
    './ParticleScene': { ParticleScene: 'scene' },
    './Tutorial/InlineTooltip': { InlineTooltip: 'tooltip' },
    './Tutorial/TutorialContext': { useTutorial: () => ({ isTutorialActive: false }) },
    '@/services/backgroundParticleClock': clock,
  });
  const tree = ParticleBox({
    onWallHit: (time) => hits.push(['pattern', time]),
    onCollisionHit: (time) => hits.push(['audio', time]),
  });
  const collision = tree.children.find((child) => child.type === 'scene').props.onWallHit;
  return { clock, collision, states, timers, hits, cleanups };
}

for (const focused of [true, false]) {
  test(`visible collisions flash and expire with focus=${focused}`, () => {
    const s = setup('visible', focused);
    s.collision('left', 12);
    assert.equal(s.states[1].has('left'), true);
    assert.deepEqual(s.hits, [['pattern', 12], ['audio', 12]]);
    s.collision('left', 13);
    assert.equal(s.timers.size, 1, 'repeated hits refresh the same wall');
    [...s.timers.values()][0]();
    assert.equal(s.states[1].size, 0);
  });
}

test('visible unfocused collisions still come from the background clock', () => {
  const s = setup('visible', false);
  const unsubscribe = s.clock.backgroundParticleClock.subscribe((time) => s.collision('right', time));
  s.clock.backgroundParticleClock.tick(14, 1 / 60);
  assert.equal(s.states[1].has('right'), true);
  assert.deepEqual(s.hits, [['pattern', 14], ['audio', 14]]);
  unsubscribe();
  s.cleanups.forEach((cleanup) => cleanup?.());
  assert.equal(s.timers.size, 0);
});

test('hidden collisions keep audio and patterns running without flash timers', () => {
  const s = setup('hidden', false);
  s.clock.backgroundParticleClock.subscribe((time) => s.collision('top', time));
  s.clock.backgroundParticleClock.tick(15, 1 / 60);
  assert.equal(s.states[1].size, 0);
  assert.equal(s.timers.size, 0);
  assert.deepEqual(s.hits, [['pattern', 15], ['audio', 15]]);
});
