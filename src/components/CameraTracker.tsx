'use client';

import React from 'react';
import { useStore } from 'jotai';
import { getParticleCameraAtom } from '@/store/atoms';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraTrackerProps } from './types';

export const CameraTracker: React.FC<CameraTrackerProps> = ({ 
  trackIndex,
  onParamsChange,
  speedRange, 
  sizeRange 
}) => {
  const { camera } = useThree();
  const store = useStore();

  useFrame(() => {
    const cameraAtom = getParticleCameraAtom(trackIndex);
    const previous = store.get(cameraAtom);
    const { x, y, z } = camera.position;
    if (!previous || previous[0] !== x || previous[1] !== y || previous[2] !== z) {
        store.set(cameraAtom, [x, y, z]);
    }

    // Get camera's spherical coordinates relative to the cube center
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(camera.position);

    // Map spherical coordinates to parameters
    // Phi (vertical angle) -> Speed (0.3x to 5x) - inverted so looking UP increases speed
    const speedFactor = speedRange[1] - (spherical.phi / Math.PI) * (speedRange[1] - speedRange[0]);

    // Theta (horizontal angle) -> Size (1x to 10x)
    // Now theta is limited to -π/2 to π/2, so we normalize differently
    const thetaNormalized = (spherical.theta + Math.PI / 2) / Math.PI; // Convert -π/2 to π/2 range to 0-1
    const sizeFactor = sizeRange[0] + thetaNormalized * (sizeRange[1] - sizeRange[0]);

    onParamsChange({
      speed: speedFactor,
      size: sizeFactor
    });
  });

  return null;
};