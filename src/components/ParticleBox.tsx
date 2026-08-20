'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { ParticleScene } from './ParticleScene';
import { ParticleParams, ParticleBoxProps } from './types';
import { InlineTooltip } from './Tutorial/InlineTooltip';
import { useTutorial } from './Tutorial/TutorialContext';
import { isPageBackgrounded } from '@/services/backgroundParticleClock';

const SPEED_RANGE: [number, number] = [0, 4];
const SIZE_RANGE: [number, number] = [2, 10];
const DEFAULT_PARTICLE_COUNT = 3;

export const ParticleBox: React.FC<ParticleBoxProps> = ({
  useLighting = false,
  particleCount: externalParticleCount,
  onWallHit: onQuantizationHit,
  onCollisionHit,
  trackIndex = 0
}) => {
  const [particleParams, setParticleParams] = useState<ParticleParams>({
    speed: 1,
    size: 1,
  });
  const [flashingWalls, setFlashingWalls] = useState<Set<string>>(new Set());
  const [internalParticleCount] = useState<number>(DEFAULT_PARTICLE_COUNT);

  // Tutorial state
  const { isTutorialActive } = useTutorial();

  // Store timeout references to prevent memory leaks
  const timeoutRefsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Use external particle count if provided, otherwise use internal state
  const particleCount = externalParticleCount ?? internalParticleCount;

  // Cleanup all timeouts on unmount
  useEffect(() => {
    const timeoutRefs = timeoutRefsRef.current;

    return () => {
      timeoutRefs.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.clear();
    };
  }, []);

  const handleWallHit = useCallback((wall: string, time?: number) => {
    // Visual feedback stays on the visual clock. Hidden-tab collisions still
    // reach the audio callbacks without creating throttled UI timers.
    if (!isPageBackgrounded()) {
      setFlashingWalls(prev => new Set(prev).add(wall));

      const existingTimeout = timeoutRefsRef.current.get(wall);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        setFlashingWalls(prev => {
          const newSet = new Set(prev);
          newSet.delete(wall);
          return newSet;
        });
        timeoutRefsRef.current.delete(wall);
      }, 150);

      timeoutRefsRef.current.set(wall, timeout);
    }

    // Call quantization callback if provided (for building patterns)
    if (onQuantizationHit) {
      onQuantizationHit(time);
    }

    // Call collision playback (for immediate audio when quantization is off)
    onCollisionHit?.(time);
  }, [onQuantizationHit, onCollisionHit]);

  return (
    <div className="w-full h-full bg-black relative">
      {/* <ParticleStats 
        speed={particleParams.speed}
        size={particleParams.size}
        count={particleCount}
      /> */}
      <ParticleScene
        particleParams={particleParams}
        onParamsChange={setParticleParams}
        flashingWalls={flashingWalls}
        onWallHit={handleWallHit}
        particleCount={particleCount}
        useLighting={useLighting}
        speedRange={SPEED_RANGE}
        sizeRange={SIZE_RANGE}
        trackIndex={trackIndex}
      />

      {/* Only show tooltip for track 1 (index 0) */}
      {trackIndex === 0 && (
        <InlineTooltip
          title="Particle Box"
          content="Drag to rotate the box and change particle speed and size."
          position="top"
          offsetX={-20}
          isVisible={isTutorialActive}
        />
      )}
    </div>
  );
};
