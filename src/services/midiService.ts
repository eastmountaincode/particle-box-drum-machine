export interface MidiDeviceInfo {
    id: string;
    name: string;
    manufacturer: string;
    type: 'input' | 'output';
}

export type MidiMessageCallback = (data: Uint8Array, timestamp: number) => void;

export class MidiService {
    private midiAccess: MIDIAccess | null = null;
    private activeInput: MIDIInput | null = null;
    private activeOutput: MIDIOutput | null = null;
    private activeOutputReady: Promise<MIDIOutput | null> | null = null;
    private inputSelectionToken = 0;
    private outputSelectionToken = 0;
    private messageCallback: MidiMessageCallback | null = null;
    private onDeviceChangeCallback: (() => void) | null = null;

    isSupported(): boolean {
        return !!navigator.requestMIDIAccess;
    }

    async initialize(): Promise<boolean> {
        if (!navigator.requestMIDIAccess) return false;
        try {
            this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
            this.midiAccess.onstatechange = () => {
                this.onDeviceChangeCallback?.();
            };
            return true;
        } catch {
            return false;
        }
    }

    getInputs(): MidiDeviceInfo[] {
        if (!this.midiAccess) return [];
        const inputs: MidiDeviceInfo[] = [];
        this.midiAccess.inputs.forEach((input) => {
            if (input.state === 'connected') {
                inputs.push({
                    id: input.id,
                    name: input.name || 'Unknown Input',
                    manufacturer: input.manufacturer || '',
                    type: 'input',
                });
            }
        });
        return inputs;
    }

    getOutputs(): MidiDeviceInfo[] {
        if (!this.midiAccess) return [];
        const outputs: MidiDeviceInfo[] = [];
        this.midiAccess.outputs.forEach((output) => {
            if (output.state === 'connected') {
                outputs.push({
                    id: output.id,
                    name: output.name || 'Unknown Output',
                    manufacturer: output.manufacturer || '',
                    type: 'output',
                });
            }
        });
        return outputs;
    }

    selectInput(deviceId: string): void {
        this.clearInput();
        if (!this.midiAccess) return;
        const input = this.midiAccess.inputs.get(deviceId);
        if (input) {
            const selectionToken = this.inputSelectionToken;
            this.activeInput = input;
            this.activeInput.onmidimessage = (event: MIDIMessageEvent) => {
                if (event.data) {
                    this.messageCallback?.(event.data, event.timeStamp);
                }
            };
            void input.open().then(
                () => {
                    if (
                        selectionToken !== this.inputSelectionToken ||
                        this.activeInput !== input
                    ) {
                        void input.close();
                    }
                },
                () => {
                    if (
                        selectionToken === this.inputSelectionToken &&
                        this.activeInput === input
                    ) {
                        input.onmidimessage = null;
                        this.activeInput = null;
                    }
                },
            );
        }
    }

    selectOutput(deviceId: string): void {
        this.clearOutput();
        if (!this.midiAccess) return;
        const output = this.midiAccess.outputs.get(deviceId);
        if (output) {
            const selectionToken = this.outputSelectionToken;
            this.activeOutput = output;
            this.activeOutputReady = output.open().then(
                () => {
                    if (
                        selectionToken !== this.outputSelectionToken ||
                        this.activeOutput !== output
                    ) {
                        void output.close();
                        return null;
                    }
                    return output;
                },
                () => {
                    if (
                        selectionToken === this.outputSelectionToken &&
                        this.activeOutput === output
                    ) {
                        this.activeOutput = null;
                    }
                    return null;
                },
            );
        }
    }

    clearInput(): void {
        this.inputSelectionToken += 1;
        if (this.activeInput) {
            const input = this.activeInput;
            input.onmidimessage = null;
            this.activeInput = null;
            void input.close();
        }
    }

    clearOutput(): void {
        this.outputSelectionToken += 1;
        const output = this.activeOutput;
        this.activeOutput = null;
        this.activeOutputReady = null;
        if (output) {
            void output.close();
        }
    }

    sendBytes(bytes: number[], timestamp?: number): void {
        const output = this.activeOutput;
        if (!output) return;

        if (output.connection === 'open') {
            output.send(bytes, timestamp);
            return;
        }

        const selectionToken = this.outputSelectionToken;
        void this.activeOutputReady?.then((readyOutput) => {
            if (
                readyOutput === output &&
                selectionToken === this.outputSelectionToken &&
                this.activeOutput === output
            ) {
                output.send(bytes, timestamp);
            }
        });
    }

    onMessage(callback: MidiMessageCallback): void {
        this.messageCallback = callback;
    }

    onDeviceChange(callback: (() => void) | null): void {
        this.onDeviceChangeCallback = callback;
    }

    async reinitialize(): Promise<boolean> {
        this.clearInput();
        this.clearOutput();
        this.midiAccess = null;
        return this.initialize();
    }

    destroy(): void {
        this.clearInput();
        this.clearOutput();
        if (this.midiAccess) {
            this.midiAccess.onstatechange = null;
        }
        this.onDeviceChangeCallback = null;
        this.midiAccess = null;
    }
}

export const midiService = new MidiService();
