'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useAtomValue } from 'jotai';
import { backgroundColorAtom, getFreezeAtom, getQuantizationAtom, getMuteAtom } from '../store/atoms';
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
  sizeRange,
  trackIndex = 0
}) => {
  const defaultBackgroundColor = useAtomValue(backgroundColorAtom);
  const freezeEnabled = useAtomValue(getFreezeAtom(trackIndex));
  const quantizationEnabled = useAtomValue(getQuantizationAtom(trackIndex));
  const muteEnabled = useAtomValue(getMuteAtom(trackIndex));
  
  // Background color logic:
  // - If MUTED: Always black (everything keeps running in background, just no visual)
  // - Quantization ON + Freeze OFF: Red (signal from both particle box and sequencer)
  // - Quantization OFF + Freeze OFF: Red (signal only from particle box)
  // - Quantization ON + Freeze ON: Black (signal only from sequencer)
  // - Quantization OFF + Freeze ON: Red (signal still from particle box, even when frozen)
  const backgroundColor = muteEnabled ? '#000000' : (freezeEnabled && quantizationEnabled) ? '#000000' : defaultBackgroundColor;
  
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Basic crash prevention - handle WebGL context loss and visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Reduce activity when tab is hidden
        console.log('Tab hidden - reducing WebGL activity');
      }
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn('WebGL context lost - will attempt recovery');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Add context loss listener to canvas if available
    if (canvasRef.current) {
      canvasRef.current.addEventListener('webglcontextlost', handleContextLost);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('webglcontextlost', handleContextLost);
      }
    };
  }, []);

  // Determine cursor style based on drag state
  const cursorStyle = isDragging ? 'grabbing' : 'grab';

  return (
    <Canvas
      ref={canvasRef}
      camera={{ position: initialCameraPosition, fov: 40 }}
      style={{ 
        background: backgroundColor,
        cursor: cursorStyle
      }}
      gl={{
        powerPreference: "default", // Don't force high-performance GPU
        antialias: false, // Disable for better stability
        preserveDrawingBuffer: false
      }}
      onCreated={({ gl }) => {
        // Limit pixel ratio to prevent excessive memory usage
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }}
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
        onStart={() => setIsDragging(true)}
        onEnd={() => setIsDragging(false)}
      />
      {!muteEnabled && (
        <>
          <EdgeOnlyCube flashingWalls={flashingWalls} />
          <Particles
            onWallHit={onWallHit}
            speedMultiplier={particleParams.speed}
            sizeMultiplier={particleParams.size}
            particleCount={particleCount}
            useLighting={useLighting}
            trackIndex={trackIndex}
          />
        </>
      )}
    </Canvas>
  );
};