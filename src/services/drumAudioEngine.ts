import * as Tone from 'tone';

const MAX_VOICES_PER_TRACK = 32;
const VOICE_STEAL_FADE_SECONDS = 0.003;
const PARAMETER_RAMP_SECONDS = 0.02;
const REVERB_REBUILD_DEBOUNCE_MS = 80;

interface TrackBus {
  input: Tone.Gain;
  dry: Tone.Gain;
  send: Tone.Gain;
  refCount: number;
  volume: number;
  reverbEnabled: boolean;
}

interface ActiveVoice {
  source: AudioBufferSourceNode;
  gain: GainNode;
  velocity: number;
  startTime: number;
  endTime: number;
}

interface ReverbSettings {
  wet: number;
  decay: number;
  preDelay: number;
}

/**
 * Shared, persistent drum graph. Decoded sample buffers are fire-and-forget:
 * every hit gets its own one-shot source, so a dense pattern never restarts a
 * previous hi-hat tail or changes an already-playing hit's velocity.
 */
class DrumAudioEngine {
  private masterGain: Tone.Gain | null = null;
  private reverbInput: Tone.Gain | null = null;
  private reverbReturn: Tone.Gain | null = null;
  private reverb: Tone.Reverb | null = null;
  private trackBuses = new Map<number, TrackBus>();
  private activeVoices = new Map<number, ActiveVoice[]>();
  private globalVolume = 0.2;
  private reverbSettings: ReverbSettings = {
    wet: 0.4,
    decay: 1.5,
    preDelay: 0.03,
  };
  private reverbRebuildTimer: ReturnType<typeof setTimeout> | null = null;
  private reverbGeneration = 0;

  retainTrack(trackIndex: number): void {
    const bus = this.ensureTrack(trackIndex);
    bus.refCount += 1;
  }

  releaseTrack(trackIndex: number): void {
    const bus = this.trackBuses.get(trackIndex);
    if (!bus) return;

    bus.refCount = Math.max(0, bus.refCount - 1);
    if (bus.refCount > 0) return;

    this.stopTrackVoices(trackIndex);
    bus.input.dispose();
    bus.dry.dispose();
    bus.send.dispose();
    this.trackBuses.delete(trackIndex);

    if (this.trackBuses.size === 0) {
      this.disposeGraph();
    }
  }

  setGlobalVolume(volume: number): void {
    this.globalVolume = Math.max(0, volume);
    this.masterGain?.gain.rampTo(this.globalVolume, PARAMETER_RAMP_SECONDS);
  }

  setTrackVolume(trackIndex: number, volume: number): void {
    const bus = this.ensureTrack(trackIndex);
    bus.volume = Math.max(0, volume);
    bus.input.gain.rampTo(bus.volume, PARAMETER_RAMP_SECONDS);
  }

  setTrackReverbEnabled(trackIndex: number, enabled: boolean): void {
    const bus = this.ensureTrack(trackIndex);
    bus.reverbEnabled = enabled;
    this.updateTrackMix(bus, true);
  }

  configureReverb(wet: number, decay: number, preDelay: number): void {
    const nextWet = Math.max(0, Math.min(1, wet));
    const nextDecay = Math.max(0.001, decay);
    const nextPreDelay = Math.max(0, preDelay);
    const impulseChanged = (
      nextDecay !== this.reverbSettings.decay
      || nextPreDelay !== this.reverbSettings.preDelay
    );

    this.reverbSettings = {
      wet: nextWet,
      decay: nextDecay,
      preDelay: nextPreDelay,
    };

    this.trackBuses.forEach((bus) => this.updateTrackMix(bus, true));

    // Wet changes only touch gains. Decay/room changes build one replacement
    // impulse response, shared by all tracks, after the UI gesture settles.
    if (impulseChanged && this.reverb) {
      this.scheduleReverbRebuild();
    }
  }

  trigger(
    trackIndex: number,
    buffer: Tone.ToneAudioBuffer,
    velocity = 1,
    time?: number
  ): void {
    if (!buffer.loaded) return;

    const bus = this.ensureTrack(trackIndex);
    const immediateTime = Tone.immediate();
    const startTime = Math.max(time ?? immediateTime, immediateTime);
    const voices = this.activeVoices.get(trackIndex) ?? [];

    // Main-thread end callbacks can be delayed in a background tab. Logical
    // pruning keeps the cap based on audio time rather than callback arrival.
    const active = voices.filter((voice) => voice.endTime > immediateTime);

    if (active.length >= MAX_VOICES_PER_TRACK) {
      const victim = active.reduce((oldest, voice) => (
        voice.endTime < oldest.endTime ? voice : oldest
      ));

      try {
        victim.gain.gain.cancelScheduledValues(startTime);
        victim.gain.gain.setValueAtTime(victim.velocity, startTime);
        victim.gain.gain.linearRampToValueAtTime(0, startTime + VOICE_STEAL_FADE_SECONDS);
        victim.source.stop(startTime + VOICE_STEAL_FADE_SECONDS);
      } catch {
        this.disconnectVoice(victim);
      }
      const victimIndex = active.indexOf(victim);
      if (victimIndex !== -1) active.splice(victimIndex, 1);
    }

    const audioBuffer = buffer.get();
    if (!audioBuffer) return;

    const context = Tone.getContext().rawContext;
    const source = context.createBufferSource();
    const gain = context.createGain();
    const hitVelocity = Math.max(0, Math.min(1, velocity));
    source.buffer = audioBuffer;
    gain.gain.setValueAtTime(hitVelocity, startTime);
    source.connect(gain);
    gain.connect(bus.input.input);

    const voice: ActiveVoice = {
      source,
      gain,
      velocity: hitVelocity,
      startTime,
      endTime: startTime + buffer.duration,
    };

    source.onended = () => {
      const currentVoices = this.activeVoices.get(trackIndex);
      if (currentVoices) {
        const index = currentVoices.indexOf(voice);
        if (index !== -1) currentVoices.splice(index, 1);
      }
      this.disconnectVoice(voice);
    };

    active.push(voice);
    this.activeVoices.set(trackIndex, active);
    source.start(startTime);
  }

  dispose(): void {
    this.trackBuses.forEach((_bus, trackIndex) => this.stopTrackVoices(trackIndex));
    this.trackBuses.forEach((bus) => {
      bus.input.dispose();
      bus.dry.dispose();
      bus.send.dispose();
    });
    this.trackBuses.clear();
    this.disposeGraph();
  }

  private ensureGraph(): void {
    if (this.masterGain && this.reverbInput && this.reverbReturn && this.reverb) return;

    const masterGain = new Tone.Gain(this.globalVolume).toDestination();
    const reverbInput = new Tone.Gain(1);
    const reverbReturn = new Tone.Gain(1);
    const reverb = this.createReverb();

    reverbInput.connect(reverb);
    reverb.connect(reverbReturn);
    reverbReturn.connect(masterGain);

    this.masterGain = masterGain;
    this.reverbInput = reverbInput;
    this.reverbReturn = reverbReturn;
    this.reverb = reverb;
  }

  private ensureTrack(trackIndex: number): TrackBus {
    this.ensureGraph();

    const existing = this.trackBuses.get(trackIndex);
    if (existing) return existing;

    const input = new Tone.Gain(1);
    const dry = new Tone.Gain(1);
    const send = new Tone.Gain(0);
    const bus: TrackBus = {
      input,
      dry,
      send,
      refCount: 0,
      volume: 1,
      reverbEnabled: false,
    };

    input.connect(dry);
    input.connect(send);
    dry.connect(this.masterGain!);
    send.connect(this.reverbInput!);
    this.trackBuses.set(trackIndex, bus);
    this.updateTrackMix(bus, false);
    return bus;
  }

  private updateTrackMix(bus: TrackBus, ramp: boolean): void {
    const dryLevel = bus.reverbEnabled ? 1 - this.reverbSettings.wet : 1;
    const sendLevel = bus.reverbEnabled ? this.reverbSettings.wet : 0;

    if (ramp) {
      bus.dry.gain.rampTo(dryLevel, PARAMETER_RAMP_SECONDS);
      bus.send.gain.rampTo(sendLevel, PARAMETER_RAMP_SECONDS);
    } else {
      bus.dry.gain.value = dryLevel;
      bus.send.gain.value = sendLevel;
    }
  }

  private createReverb(): Tone.Reverb {
    return new Tone.Reverb({
      decay: this.reverbSettings.decay,
      preDelay: this.reverbSettings.preDelay,
      wet: 1,
    });
  }

  private scheduleReverbRebuild(): void {
    if (this.reverbRebuildTimer !== null) {
      clearTimeout(this.reverbRebuildTimer);
    }

    this.reverbRebuildTimer = setTimeout(() => {
      this.reverbRebuildTimer = null;
      this.rebuildReverb();
    }, REVERB_REBUILD_DEBOUNCE_MS);
  }

  private rebuildReverb(): void {
    const input = this.reverbInput;
    const reverbReturn = this.reverbReturn;
    if (!input || !reverbReturn) return;

    const generation = ++this.reverbGeneration;
    const nextReverb = this.createReverb();

    void nextReverb.ready.then(() => {
      if (
        generation !== this.reverbGeneration
        || input !== this.reverbInput
        || reverbReturn !== this.reverbReturn
      ) {
        nextReverb.dispose();
        return;
      }

      const previousReverb = this.reverb;
      input.connect(nextReverb);
      nextReverb.connect(reverbReturn);
      if (previousReverb) {
        input.disconnect(previousReverb);
        previousReverb.dispose();
      }
      this.reverb = nextReverb;
    }).catch((error) => {
      nextReverb.dispose();
      console.error('Could not rebuild shared reverb:', error);
    });
  }

  private stopTrackVoices(trackIndex: number): void {
    const voices = this.activeVoices.get(trackIndex) ?? [];
    const stopTime = Tone.immediate();

    voices.forEach((voice) => {
      try {
        voice.gain.gain.cancelScheduledValues(stopTime);
        voice.gain.gain.setValueAtTime(voice.velocity, stopTime);
        voice.gain.gain.linearRampToValueAtTime(0, stopTime + VOICE_STEAL_FADE_SECONDS);
        voice.source.stop(stopTime + VOICE_STEAL_FADE_SECONDS);
      } catch {
        this.disconnectVoice(voice);
      }
    });
    this.activeVoices.delete(trackIndex);
  }

  private disconnectVoice(voice: ActiveVoice): void {
    voice.source.onended = null;
    voice.source.disconnect();
    voice.gain.disconnect();
  }

  private disposeGraph(): void {
    if (this.reverbRebuildTimer !== null) {
      clearTimeout(this.reverbRebuildTimer);
      this.reverbRebuildTimer = null;
    }
    this.reverbGeneration += 1;
    this.reverb?.dispose();
    this.reverbInput?.dispose();
    this.reverbReturn?.dispose();
    this.masterGain?.dispose();
    this.reverb = null;
    this.reverbInput = null;
    this.reverbReturn = null;
    this.masterGain = null;
  }
}

export const drumAudioEngine = new DrumAudioEngine();
