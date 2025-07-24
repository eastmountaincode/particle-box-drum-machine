'use client';

import React, { useCallback, useState } from 'react';
import * as THREE from 'three';
import { ParticleScene } from './ParticleScene';
import { ParticleParams, ParticleBoxProps } from './types';
import { useCollisionPlayback } from '@/hooks/useCollisionPlayback';

const SPEED_RANGE: [number, number] = [0.2, 4];
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

  // Use external particle count if provided, otherwise use internal state
  const particleCount = externalParticleCount ?? internalParticleCount;

  const handleWallHit = useCallback((wall: string, position: THREE.Vector3) => {
    // Trigger wall flash (existing functionality)
    setFlashingWalls(prev => new Set(prev).add(wall));

    // Remove flash after 150ms
    setTimeout(() => {
      setFlashingWalls(prev => {
        const newSet = new Set(prev);
        newSet.delete(wall);
        return newSet;
      });
    }, 150);

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