'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAtomValue, useStore } from 'jotai';
import * as Tone from 'tone';
import {
    getSequencerStepsAtom, getQuantizationAtom, getMuteAtom, getFreezeAtom,
    isPlayingAtom, syncModeAtom, midiDetectedBpmAtom,
} from '@/store/atoms';
import { nearestTriggerStep, type StepAnchor } from '@/utils/triggerTiming';

export const useTrackSamplePlayback = (
    trackIndex: number,
    playSample: (velocity?: number, time?: number) => void
) => {
    const store = useStore();
    const isPlaying = useAtomValue(isPlayingAtom);
    const syncMode = useAtomValue(syncModeAtom);
    const anchorRef = useRef<StepAnchor | null>(null);
    const externalDurationRef = useRef<number | null>(null);
    const skipRef = useRef<StepAnchor | null>(null);

    useEffect(() => {
        anchorRef.current = null;
        externalDurationRef.current = null;
        skipRef.current = null;
    }, [isPlaying, syncMode]);

    const onStepTriggered = useCallback((step: number, time = Tone.immediate()) => {
        const previous = anchorRef.current;
        if (previous && step === (previous.step + 1) % 16 && time > previous.time) {
            externalDurationRef.current = time - previous.time;
        }
        anchorRef.current = { step, time };

        // A newly inserted upcoming step has already sounded under the player's
        // finger. Suppress only this occurrence; it plays normally next loop.
        const skip = skipRef.current;
        if (skip && time >= skip.time - 0.02) {
            skipRef.current = null;
            if (skip.step === step && Math.abs(time - skip.time) < 0.02) return;
        }

        if (
            store.get(getQuantizationAtom(trackIndex))
            && store.get(getFreezeAtom(trackIndex))
            && !store.get(getMuteAtom(trackIndex))
            && store.get(getSequencerStepsAtom(trackIndex))[step]
        ) {
            playSample(1, time);
        }
    }, [playSample, store, trackIndex]);

    const trigger = useCallback(() => {
        const now = Tone.immediate();
        const muted = store.get(getMuteAtom(trackIndex));
        if (!muted) {
            if (Tone.context.state === 'running') {
                playSample(1, now);
            } else {
                void Tone.start().then(() => playSample(1, Tone.immediate())).catch((error) => {
                    console.error('Could not start trigger audio:', error);
                });
            }
        }

        if (
            !store.get(isPlayingAtom)
            || !store.get(getFreezeAtom(trackIndex))
            || !store.get(getQuantizationAtom(trackIndex))
        ) return;

        let target: StepAnchor;
        if (store.get(syncModeAtom) === 'follower') {
            const anchor = anchorRef.current;
            if (!anchor) return;
            const bpm = store.get(midiDetectedBpmAtom);
            const duration = bpm ? 60 / bpm / 4 : externalDurationRef.current;
            // Before enough external clock arrives, the received step is the
            // only known position. Never guess using the local tempo.
            target = duration ? nearestTriggerStep(anchor, now, duration) : anchor;
        } else {
            // Transport.ticks includes look-ahead. Read ticks at the actual tap
            // time so an early callback cannot move the recorded hit forward.
            const ticksPerStep = Tone.Transport.PPQ / 4;
            const position = Tone.Transport.getTicksAtTime(now) / ticksPerStep;
            const rounded = Math.round(position);
            target = {
                step: ((rounded % 16) + 16) % 16,
                time: now + (rounded - position) * 60 / Tone.Transport.bpm.value / 4,
            };
        }

        const stepsAtom = getSequencerStepsAtom(trackIndex);
        const steps = store.get(stepsAtom);
        if (steps[target.step]) return;
        const next = [...steps];
        next[target.step] = true;
        // Set before notifying subscribers so the scheduler sees the suppression.
        if (target.time > now) skipRef.current = target;
        store.set(stepsAtom, next);
    }, [playSample, store, trackIndex]);

    return { onStepTriggered, trigger };
};
