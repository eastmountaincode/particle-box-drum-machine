'use client';

import React from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraTrackerProps } from './types';

export const CameraTracker: React.FC<CameraTrackerProps> = ({ 
  onParamsChange, 
  speedRange, 
  sizeRange 
}) => {
  const { camera } = useThree();

  useFrame(() => {
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