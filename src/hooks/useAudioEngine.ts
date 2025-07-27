'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAtom } from 'jotai';
import * as Tone from 'tone';
import { currentStepAtom } from '@/store/atoms';

interface UseAudioEngineReturn {
    isPlaying: boolean;
    start: () => Promise<void>;
    stop: () => void;
    registerStepCallback: (trackIndex: number, callback: (step: number) => void) => void;
    unregisterStepCallback: (trackIndex: number) => void;
}

export const useAudioEngine = (bpm: number): UseAudioEngineReturn => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useAtom(currentStepAtom);
    const sequenceRef = useRef<Tone.Sequence | null>(null);
    const isInitializedRef = useRef(false);
    const isStoppedRef = useRef(false);
    const stepCallbacksRef = useRef<Map<number, (step: number) => void>>(new Map());

    // Initialize Tone.js transport
    useEffect(() => {
        if (!isInitializedRef.current) {
            // Set up the transport
            Tone.Transport.bpm.value = bpm;
            isInitializedRef.current = true;
        }

        return () => {
            // Cleanup on unmount
            if (sequenceRef.current) {
                sequenceRef.current.dispose();
            }
            Tone.Transport.stop();
            Tone.Transport.cancel();
        };
    }, []);

    // Update BPM when it changes
    useEffect(() => {
        Tone.Transport.bpm.value = bpm;
    }, [bpm]);

    // Register/unregister track callbacks
    const registerStepCallback = useCallback((trackIndex: number, callback: (step: number) => void) => {
        stepCallbacksRef.current.set(trackIndex, callback);
    }, []);

    const unregisterStepCallback = useCallback((trackIndex: number) => {
        stepCallbacksRef.current.delete(trackIndex);
    }, []);

    // Create the sequence
    useEffect(() => {
        // Dispose of existing sequence
        if (sequenceRef.current) {
            sequenceRef.current.dispose();
        }

        // Create new sequence for 16 steps (16th notes)
        sequenceRef.current = new Tone.Sequence(
            (time, step) => {
                // Schedule the step update and callback execution to happen at the right time
                Tone.Draw.schedule(() => {
                    // Only update step if we're not stopped
                    if (!isStoppedRef.current) {
                        setCurrentStep(step);
                        
                        // Trigger all registered track callbacks at the precise time
                        stepCallbacksRef.current.forEach((callback) => {
                            callback(step);
                        });
                    }
                }, time);
            },
            Array.from({ length: 16 }, (_, i) => i), // [0, 1, 2, ..., 15]
            '16n' // 16th notes
        );

        return () => {
            if (sequenceRef.current) {
                sequenceRef.current.dispose();
            }
        };
    }, [setCurrentStep]);

    const start = useCallback(async () => {
        try {
            // Start Tone.js audio context (required for user interaction)
            if (Tone.context.state !== 'running') {
                await Tone.start();
            }

            // Clear the stopped flag
            isStoppedRef.current = false;

            // Start the sequence and transport
            if (sequenceRef.current) {
                sequenceRef.current.start(0);
            }
            Tone.Transport.start();
            setIsPlaying(true);
            setCurrentStep(0); // Reset to first step
        } catch (error) {
            console.error('Failed to start audio engine:', error);
        }
    }, [setCurrentStep]);

    const stop = useCallback(() => {
        // Set the stopped flag to prevent further step updates
        isStoppedRef.current = true;

        // Stop the transport and sequence
        Tone.Transport.stop();
        if (sequenceRef.current) {
            // Pass 0 to ensure we never pass a negative time value
            // This prevents floating point precision issues that can cause RangeError
            sequenceRef.current.stop(0);
        }
        setIsPlaying(false);

        // Don't reset the step - leave it where it stopped
    }, []);

    return {
        isPlaying,
        start,
        stop,
        registerStepCallback,
        unregisterStepCallback
    };
};