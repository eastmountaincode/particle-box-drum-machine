export interface StepAnchor {
    step: number;
    time: number;
}

/** Use audio time, including negative offsets from a look-ahead callback. */
export function nearestTriggerStep(anchor: StepAnchor, now: number, stepDuration: number) {
    const offset = Math.round((now - anchor.time) / stepDuration);
    return {
        step: ((anchor.step + offset) % 16 + 16) % 16,
        time: anchor.time + offset * stepDuration,
    };
}
