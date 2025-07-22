'use client';

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useAtomValue } from 'jotai';
import { backgroundColorAtom } from '../store/atoms';
import { CameraTracker } from './CameraTracker';
import { SceneLighting } from './SceneLighting';
import { EdgeOnlyCube } from './EdgeOnlyCube';
import { Particles } from './Particles';
import { ParticleSceneProps } from './types';
import * as THREE from 'three';

export const ParticleScene: React.FC<ParticleSceneProps> = ({
  particleParams,
  onParamsChange,
  flashingWalls,
  onWallHit,
  particleCount,
  useLighting,
  speedRange,
  sizeRange
}) => {
  const backgroundColor = useAtomValue(backgroundColorAtom);

  // Generate random initial camera position using spherical coordinates
  const initialCameraPosition = useMemo(() => {
    // Random azimuth (theta) within the constrained range [-π/2, π/2]
    const randomAzimuth = (Math.random() - 0.5) * Math.PI; // Range: [-π/2, π/2]
    
    // Random polar (phi) within full range [0, π] to ensure full parameter coverage
    const randomPolar = Math.random() * Math.PI; // Range: [0, π]
    
    // Calculate distance from origin to maintain same zoom level as [4,4,4]
    const originalDistance = Math.sqrt(4*4 + 4*4 + 4*4); // ~6.93
    
    // Convert spherical to cartesian coordinates
    const spherical = new THREE.Spherical(originalDistance, randomPolar, randomAzimuth);
    const position = new THREE.Vector3();
    position.setFromSpherical(spherical);
    
    return [position.x, position.y, position.z] as [number, number, number];
  }, []); // Only generate once per component mount

  return (
    <Canvas
      camera={{ position: initialCameraPosition, fov: 40 }}
      style={{ background: backgroundColor }}
    >
      <CameraTracker 
        onParamsChange={onParamsChange}
        speedRange={speedRange}
        sizeRange={sizeRange}
      />
      {useLighting && <SceneLighting />}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableRotate={true}
        minDistance={1.5}
        maxDistance={8}
        minAzimuthAngle={-Math.PI / 2}
        maxAzimuthAngle={Math.PI / 2}
      />
      <EdgeOnlyCube flashingWalls={flashingWalls} />
      <Particles
        onWallHit={onWallHit}
        speedMultiplier={particleParams.speed}
        sizeMultiplier={particleParams.size}
        particleCount={particleCount}
        useLighting={useLighting}
      />
    </Canvas>
  );
};