import { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';

export type CollisionType = 'wall' | 'particle';

interface CollisionScheduler {
  registerCollision: (type: CollisionType) => void;
  start: () => void;
  stop: () => void;
  isPlaying: boolean;
}

export const useCollisionScheduler = (bpm: number = 120): CollisionScheduler => {
  const wallSynthRef = useRef<Tone.Synth | null>(null);
  const particleSynthRef = useRef<Tone.Synth | null>(null);
  const scheduledCollisionsRef = useRef<CollisionType[]>([]);
  const isPlayingRef = useRef(false);

  // Initialize Tone.js components
  useEffect(() => {
    // Create synthesizers for different collision types
    wallSynthRef.current = new Tone.Synth({
      oscillator: {
        type: 'square'
      },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0,
        release: 0.1
      }
    }).toDestination();

    particleSynthRef.current = new Tone.Synth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.01,
        decay: 0.05,
        sustain: 0,
        release: 0.05
      }
    }).toDestination();

    // Set up Transport tempo
    Tone.Transport.bpm.value = bpm;

    // Schedule collision playback on 16th notes
    const scheduledEvent = Tone.Transport.scheduleRepeat((time) => {
      if (scheduledCollisionsRef.current.length > 0) {
        const collision = scheduledCollisionsRef.current.shift();
        
        if (collision === 'wall' && wallSynthRef.current) {
          wallSynthRef.current.triggerAttackRelease('C4', '16n', time);
        } else if (collision === 'particle' && particleSynthRef.current) {
          particleSynthRef.current.triggerAttackRelease('G4', '16n', time);
        }
      }
    }, '16n');

    return () => {
      Tone.Transport.clear(scheduledEvent);
      if (wallSynthRef.current) {
        wallSynthRef.current.dispose();
      }
      if (particleSynthRef.current) {
        particleSynthRef.current.dispose();
      }
    };
  }, [bpm]);

  const registerCollision = useCallback((type: CollisionType) => {
    scheduledCollisionsRef.current.push(type);
  }, []);

  const start = useCallback(async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    Tone.Transport.start();
    isPlayingRef.current = true;
  }, []);

  const stop = useCallback(() => {
    Tone.Transport.stop();
    isPlayingRef.current = false;
    scheduledCollisionsRef.current = [];
  }, []);

  return {
    registerCollision,
    start,
    stop,
    isPlaying: isPlayingRef.current
  };
}; 