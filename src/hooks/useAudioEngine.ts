'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import * as Tone from 'tone';
import { currentStepAtom, syncModeAtom, type SyncMode } from '@/store/atoms';
import { midiClockManager } from '@/services/midiClockManager';
import { backgroundParticleClock, isPageBackgrounded } from '@/services/backgroundParticleClock';

const PARTICLE_CLOCK_HZ = 60;
const PARTICLE_CLOCK_DELTA = 1 / PARTICLE_CLOCK_HZ;
const MAX_STALE_CLOCK_SECONDS = 0.05;
const KEEP_ALIVE_FREQUENCY_HZ = 20;
const KEEP_ALIVE_GAIN = 0.000001;

interface UseAudioEngineReturn {
    isPlaying: boolean;
    start: () => Promise<void>;
    stop: () => void;
    registerStepCallback: (trackIndex: number, callback: (step: number, time?: number) => void) => void;
    unregisterStepCallback: (trackIndex: number) => void;
    handleExternalStep: (step: number) => void;
    handleExternalStart: () => void;
    handleExternalContinue: () => void;
    handleExternalStop: () => void;
}

export const useAudioEngine = (bpm: number): UseAudioEngineReturn => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [, setCurrentStep] = useAtom(currentStepAtom);
    const syncMode = useAtomValue(syncModeAtom);
    const sequenceRef = useRef<Tone.Sequence | null>(null);
    const particleClockRef = useRef<Tone.Clock | null>(null);
    const keepAliveOscillatorRef = useRef<Tone.Oscillator | null>(null);
    const keepAliveGainRef = useRef<Tone.Gain | null>(null);
    const resumePendingRef = useRef<Promise<void> | null>(null);
    const clockEventIdRef = useRef<number | null>(null);
    const isInitializedRef = useRef(false);
    const isStoppedRef = useRef(true);
    const stepCallbacksRef = useRef<Map<number, (step: number, time?: number) => void>>(new Map());
    const syncModeRef = useRef<SyncMode>(syncMode);

    // Keep ref in sync with atom
    useEffect(() => {
        syncModeRef.current = syncMode;
    }, [syncMode]);

    const setMediaSessionState = useCallback((state: MediaSessionPlaybackState) => {
        if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

        try {
            navigator.mediaSession.playbackState = state;
        } catch {
            // Media Session is only a hint and is not implemented consistently.
        }
    }, []);

    const startParticleClock = useCallback(() => {
        if (!particleClockRef.current) {
            particleClockRef.current = new Tone.Clock((time) => {
                if (isStoppedRef.current) return;
                if (time < Tone.immediate() - MAX_STALE_CLOCK_SECONDS) return;

                backgroundParticleClock.tick(time, PARTICLE_CLOCK_DELTA);
            }, PARTICLE_CLOCK_HZ);
        }

        if (particleClockRef.current.state !== 'started') {
            particleClockRef.current.start();
        }
    }, []);

    const stopParticleClock = useCallback(() => {
        if (particleClockRef.current?.state === 'started') {
            particleClockRef.current.stop(Tone.immediate());
        }
    }, []);

    const startKeepAlive = useCallback(() => {
        if (keepAliveOscillatorRef.current || keepAliveGainRef.current) return;

        const gain = new Tone.Gain(KEEP_ALIVE_GAIN).toDestination();
        const oscillator = new Tone.Oscillator(KEEP_ALIVE_FREQUENCY_HZ, 'sine').connect(gain);
        oscillator.start();
        keepAliveGainRef.current = gain;
        keepAliveOscillatorRef.current = oscillator;
    }, []);

    const stopKeepAlive = useCallback(() => {
        const oscillator = keepAliveOscillatorRef.current;
        const gain = keepAliveGainRef.current;

        if (oscillator) {
            try {
                if (oscillator.state === 'started') oscillator.stop(Tone.immediate());
            } catch {
                // The oscillator may already have been stopped by context teardown.
            }
            oscillator.dispose();
        }
        gain?.dispose();
        keepAliveOscillatorRef.current = null;
        keepAliveGainRef.current = null;
    }, []);

    const activateBackgroundSupport = useCallback(() => {
        startParticleClock();
        startKeepAlive();
        setMediaSessionState('playing');
    }, [setMediaSessionState, startKeepAlive, startParticleClock]);

    const deactivateBackgroundSupport = useCallback(() => {
        stopParticleClock();
        stopKeepAlive();
        setMediaSessionState('none');
    }, [setMediaSessionState, stopKeepAlive, stopParticleClock]);

    const recoverAudioContext = useCallback(() => {
        if (
            isStoppedRef.current
            || Tone.context.state === 'running'
            || Tone.context.state === 'closed'
            || resumePendingRef.current
        ) {
            return;
        }

        const resumePromise = Tone.start()
            .catch((error) => {
                console.warn('Audio context could not resume yet:', error);
            })
            .finally(() => {
                resumePendingRef.current = null;
            });
        resumePendingRef.current = resumePromise;
    }, []);

    // Initialize Tone.js transport with crash prevention
    useEffect(() => {
        if (isInitializedRef.current) return;

        isInitializedRef.current = true;

        const syncVisibleStep = () => {
            if (
                isStoppedRef.current
                || syncModeRef.current === 'follower'
                || isPageBackgrounded()
            ) {
                return;
            }

            const ticksPerStep = Tone.Transport.PPQ / 4;
            const step = Math.floor(Tone.Transport.ticks / ticksPerStep) % 16;
            setCurrentStep(step);
        };

        const handleLifecycleChange = () => {
            recoverAudioContext();
            syncVisibleStep();
        };

        const handlePageHide = () => {
            if (!isStoppedRef.current && syncModeRef.current === 'leader') {
                midiClockManager.onInternalStop();
            }
        };

        const rawContext = Tone.getContext().rawContext;

        document.addEventListener('visibilitychange', handleLifecycleChange);
        window.addEventListener('focus', handleLifecycleChange);
        window.addEventListener('blur', handleLifecycleChange);
        window.addEventListener('pageshow', handleLifecycleChange);
        window.addEventListener('pointerdown', recoverAudioContext);
        window.addEventListener('keydown', recoverAudioContext);
        window.addEventListener('pagehide', handlePageHide);
        rawContext.addEventListener('statechange', recoverAudioContext);

        return () => {
            document.removeEventListener('visibilitychange', handleLifecycleChange);
            window.removeEventListener('focus', handleLifecycleChange);
            window.removeEventListener('blur', handleLifecycleChange);
            window.removeEventListener('pageshow', handleLifecycleChange);
            window.removeEventListener('pointerdown', recoverAudioContext);
            window.removeEventListener('keydown', recoverAudioContext);
            window.removeEventListener('pagehide', handlePageHide);
            rawContext.removeEventListener('statechange', recoverAudioContext);
            if (!isStoppedRef.current && syncModeRef.current === 'leader') {
                midiClockManager.onInternalStop();
            }
            deactivateBackgroundSupport();
            particleClockRef.current?.dispose();
            particleClockRef.current = null;
            if (sequenceRef.current) {
                sequenceRef.current.dispose();
                sequenceRef.current = null;
            }
            if (clockEventIdRef.current !== null) {
                Tone.Transport.clear(clockEventIdRef.current);
                clockEventIdRef.current = null;
            }
            Tone.Transport.stop();
            Tone.Transport.cancel();
            isInitializedRef.current = false;
        };
    }, [deactivateBackgroundSupport, recoverAudioContext, setCurrentStep]);

    // Update BPM when it changes
    useEffect(() => {
        Tone.Transport.bpm.value = bpm;
    }, [bpm]);

    // Register/unregister track callbacks
    const registerStepCallback = useCallback((trackIndex: number, callback: (step: number, time?: number) => void) => {
        stepCallbacksRef.current.set(trackIndex, callback);
    }, []);

    const unregisterStepCallback = useCallback((trackIndex: number) => {
        stepCallbacksRef.current.delete(trackIndex);
    }, []);

    // Follower mode: handle externally-driven steps
    const handleExternalStep = useCallback((step: number) => {
        if (isStoppedRef.current) return;

        const time = Tone.immediate();
        setCurrentStep(step);
        stepCallbacksRef.current.forEach((callback) => {
            callback(step, time);
        });
    }, [setCurrentStep]);

    const handleExternalStart = useCallback(async () => {
        // Ensure audio context is running
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
        isStoppedRef.current = false;
        activateBackgroundSupport();
        setIsPlaying(true);
        setCurrentStep(0);
    }, [activateBackgroundSupport, setCurrentStep]);

    const handleExternalContinue = useCallback(async () => {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
        isStoppedRef.current = false;
        activateBackgroundSupport();
        setIsPlaying(true);
    }, [activateBackgroundSupport]);

    const handleExternalStop = useCallback(() => {
        isStoppedRef.current = true;
        deactivateBackgroundSupport();
        setIsPlaying(false);
    }, [deactivateBackgroundSupport]);

    // Create the sequence (only used in internal + leader modes)
    useEffect(() => {
        // Dispose of existing sequence
        if (sequenceRef.current) {
            sequenceRef.current.dispose();
            sequenceRef.current = null;
        }

        // Don't create sequence in follower mode
        if (syncMode === 'follower') return;

        // Create new sequence for 16 steps (16th notes)
        sequenceRef.current = new Tone.Sequence(
            (time, step) => {
                if (!isStoppedRef.current) {
                    // Trigger audio callbacks directly from the Web Audio thread
                    stepCallbacksRef.current.forEach((callback) => {
                        callback(step, time);
                    });

                    // React is a visual mirror only. Do not queue rAF-backed Draw
                    // events while a hidden or unfocused window cannot consume them.
                    if (!isPageBackgrounded()) {
                        Tone.Draw.schedule(() => {
                            setCurrentStep(step);
                        }, time);
                    }
                }
            },
            Array.from({ length: 16 }, (_, i) => i),
            '16n'
        );

        return () => {
            if (sequenceRef.current) {
                sequenceRef.current.dispose();
                sequenceRef.current = null;
            }
        };
    }, [setCurrentStep, syncMode]);

    // Leader mode: schedule MIDI clock output at 24 PPQN.
    useEffect(() => {
        // Clear any existing clock event
        if (clockEventIdRef.current !== null) {
            Tone.Transport.clear(clockEventIdRef.current);
            clockEventIdRef.current = null;
        }

        if (syncMode === 'leader') {
            // A quarter note divided by 24 is a 96th note.
            clockEventIdRef.current = Tone.Transport.scheduleRepeat((time) => {
                const timestamp = performance.now() + Math.max(0, time - Tone.immediate()) * 1000;
                midiClockManager.onInternalTick(timestamp);
            }, '96n');
        }

        return () => {
            if (clockEventIdRef.current !== null) {
                Tone.Transport.clear(clockEventIdRef.current);
                clockEventIdRef.current = null;
            }
        };
    }, [syncMode]);

    const start = useCallback(async () => {
        try {
            // Start Tone.js audio context (required for user interaction)
            if (Tone.context.state !== 'running') {
                await Tone.start();
            }

            // In follower mode, don't start Tone transport - just mark as ready
            if (syncModeRef.current === 'follower') {
                isStoppedRef.current = false;
                activateBackgroundSupport();
                setIsPlaying(true);
                return;
            }

            // Clear the stopped flag
            isStoppedRef.current = false;
            activateBackgroundSupport();

            // MIDI Start must precede the first clock tick.
            if (syncModeRef.current === 'leader') {
                midiClockManager.onInternalStart();
            }

            // Start the sequence and transport.
            if (sequenceRef.current) {
                sequenceRef.current.start(0);
            }
            Tone.Transport.start();
            setIsPlaying(true);
            setCurrentStep(0);
        } catch (error) {
            console.error('Failed to start audio engine:', error);
        }
    }, [activateBackgroundSupport, setCurrentStep]);

    const stop = useCallback(() => {
        // Set the stopped flag to prevent further step updates
        isStoppedRef.current = true;
        deactivateBackgroundSupport();

        // In follower mode, just update playing state
        if (syncModeRef.current === 'follower') {
            setIsPlaying(false);
            return;
        }

        // Leader mode: send MIDI stop
        if (syncModeRef.current === 'leader') {
            midiClockManager.onInternalStop();
        }

        // Stop the transport and sequence
        Tone.Transport.stop();
        if (sequenceRef.current) {
            sequenceRef.current.stop(0);
        }
        setIsPlaying(false);
    }, [deactivateBackgroundSupport]);

    return {
        isPlaying,
        start,
        stop,
        registerStepCallback,
        unregisterStepCallback,
        handleExternalStep,
        handleExternalStart,
        handleExternalContinue,
        handleExternalStop,
    };
};
