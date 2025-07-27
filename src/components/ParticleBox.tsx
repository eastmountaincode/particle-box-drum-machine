'use client';

import React, { useCallback, useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { ParticleScene } from './ParticleScene';
import { ParticleParams, ParticleBoxProps } from './types';
import { useCollisionPlayback } from '@/hooks/useCollisionPlayback';

const SPEED_RANGE: [number, number] = [0, 4];
const SIZE_RANGE: [number, number] = [2, 10];
const DEFAULT_PARTICLE_COUNT = 3;

export const ParticleBox: React.FC<ParticleBoxProps> = ({ 
  useLighting = false, 
  particleCount: externalParticleCount,
  onWallHit: onQuantizationHit,
  trackIndex = 0
}) => {
  const [particleParams, setParticleParams] = useState<ParticleParams>({
    speed: 1,
    size: 1,
  });
  const [flashingWalls, setFlashingWalls] = useState<Set<string>>(new Set());
  const [internalParticleCount, _] = useState<number>(DEFAULT_PARTICLE_COUNT);
  
  // Use collision playback hook for immediate audio
  const { onCollisionHit } = useCollisionPlayback(trackIndex);

  // Store timeout references to prevent memory leaks
  const timeoutRefsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Use external particle count if provided, otherwise use internal state
  const particleCount = externalParticleCount ?? internalParticleCount;

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefsRef.current.clear();
    };
  }, []);

  const handleWallHit = useCallback((wall: string, position: THREE.Vector3) => {
    // Trigger wall flash (existing functionality)
    setFlashingWalls(prev => new Set(prev).add(wall));

    // Clear any existing timeout for this wall to prevent accumulation
    const existingTimeout = timeoutRefsRef.current.get(wall);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout and store reference
    const timeout = setTimeout(() => {
      setFlashingWalls(prev => {
        const newSet = new Set(prev);
        newSet.delete(wall);
        return newSet;
      });
      // Clean up the timeout reference
      timeoutRefsRef.current.delete(wall);
    }, 150);
    
    // Store the timeout reference
    timeoutRefsRef.current.set(wall, timeout);

    // Call quantization callback if provided (for building patterns)
    if (onQuantizationHit) {
      onQuantizationHit();
    }
    
    // Call collision playback (for immediate audio when quantization is off)
    onCollisionHit();
  }, [onQuantizationHit, onCollisionHit]);

  return (
    <div className="w-full h-full bg-black">
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
    </div>
  );
}; 