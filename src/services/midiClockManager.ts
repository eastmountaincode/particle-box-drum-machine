import { midiService } from './midiService';

export type SyncMode = 'internal' | 'follower' | 'leader';

// MIDI System Real-Time messages
const MIDI_CLOCK = 0xF8;
const MIDI_START = 0xFA;
const MIDI_CONTINUE = 0xFB;
const MIDI_STOP = 0xFC;

const NUM_STEPS = 16;
const TICKS_PER_STEP = 6; // 24 PPQN / 4 (16th notes per quarter)
const TOTAL_TICKS = NUM_STEPS * TICKS_PER_STEP; // 96

export interface MidiClockCallbacks {
    onExternalStep: (step: number) => void;
    onExternalStart: () => void;
    onExternalContinue: () => void;
    onExternalStop: () => void;
    onDetectedBpmChange: (bpm: number) => void;
}

export class MidiClockManager {
    private syncMode: SyncMode = 'internal';
    private globalTick: number = 0;
    private running: boolean = false;
    private callbacks: MidiClockCallbacks | null = null;
    private clockTimestamps: number[] = [];
    private readonly BPM_SAMPLE_SIZE = 24; // one beat's worth of clocks

    constructor() {
        midiService.onMessage(this.handleMidiMessage.bind(this));
    }

    setCallbacks(cb: MidiClockCallbacks | null): void {
        this.callbacks = cb;
    }

    setSyncMode(mode: SyncMode): void {
        this.syncMode = mode;
        this.running = false;
        this.globalTick = 0;
        this.clockTimestamps = [];
    }

    getSyncMode(): SyncMode {
        return this.syncMode;
    }

    // Called by audio engine in leader mode on each PPQN tick
    onInternalTick(timestamp?: number): void {
        if (this.syncMode === 'leader') {
            midiService.sendBytes([MIDI_CLOCK], timestamp);
        }
    }

    // Called by audio engine in leader mode on start
    onInternalStart(): void {
        if (this.syncMode === 'leader') {
            midiService.sendBytes([MIDI_START]);
        }
    }

    // Called by audio engine in leader mode on stop
    onInternalStop(): void {
        if (this.syncMode === 'leader') {
            midiService.sendBytes([MIDI_STOP]);
        }
    }

    // Called from incoming hardware MIDI. Non-clock messages are ignored.
    handleMidiMessage(data: Uint8Array, timestamp: number): void {
        if (this.syncMode !== 'follower') return;

        const status = data[0];

        switch (status) {
            case MIDI_CLOCK:
                this.handleClockTick(timestamp);
                break;
            case MIDI_START:
                this.running = true;
                this.globalTick = 0;
                this.clockTimestamps = [];
                this.callbacks?.onExternalStart();
                break;
            case MIDI_CONTINUE:
                this.running = true;
                this.callbacks?.onExternalContinue();
                break;
            case MIDI_STOP:
                this.running = false;
                this.callbacks?.onExternalStop();
                break;
        }
    }

    private handleClockTick(timestamp: number): void {
        if (!this.running) return;

        // Step boundary: every 6 ticks = 1 step
        if (this.globalTick % TICKS_PER_STEP === 0) {
            const step = Math.floor(this.globalTick / TICKS_PER_STEP) % NUM_STEPS;
            this.callbacks?.onExternalStep(step);
        }

        // Advance tick
        this.globalTick++;
        if (this.globalTick >= TOTAL_TICKS) this.globalTick = 0;

        // BPM detection from incoming clock intervals
        this.clockTimestamps.push(timestamp);
        if (this.clockTimestamps.length > this.BPM_SAMPLE_SIZE) {
            this.clockTimestamps.shift();
        }
        if (this.clockTimestamps.length >= 2) {
            const totalTime =
                this.clockTimestamps[this.clockTimestamps.length - 1] -
                this.clockTimestamps[0];
            const avgTickInterval = totalTime / (this.clockTimestamps.length - 1);
            // 24 ticks per quarter note, avgTickInterval in ms
            const detectedBpm = Math.round(60000 / (avgTickInterval * 24));
            if (detectedBpm >= 20 && detectedBpm <= 300) {
                this.callbacks?.onDetectedBpmChange(detectedBpm);
            }
        }
    }
}

export const midiClockManager = new MidiClockManager();
