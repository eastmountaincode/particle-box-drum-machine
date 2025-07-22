import React, { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useAtomValue } from 'jotai';
import { backgroundColorAtom } from '../store/atoms';
import * as THREE from 'three';
import { Particle } from './types';

interface ParticlesProps {
  onWallHit: (wall: string, position: THREE.Vector3) => void;
  speedMultiplier?: number;
  sizeMultiplier?: number;
  particleCount?: number;
  useLighting?: boolean;
}

export const Particles: React.FC<ParticlesProps> = ({
  onWallHit,
  speedMultiplier = 1,
  sizeMultiplier = 1,
  particleCount = 15,
  useLighting = false
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<Particle[]>([]);
  const backgroundColor = useAtomValue(backgroundColorAtom);
  const cubeSize = 2.5;
  const cubeHalf = cubeSize / 2;
  const particleRadius = 0.05;
  const { camera } = useThree();

  // Create a single particle with random position and velocity
  const createParticle = useCallback((): Particle => {
    return {
      position: new THREE.Vector3(
        (Math.random() - 0.5) * (cubeSize - particleRadius * 2),
        (Math.random() - 0.5) * (cubeSize - particleRadius * 2),
        (Math.random() - 0.5) * (cubeSize - particleRadius * 2)
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      )
    };
  }, [cubeSize, particleRadius]);

  // Create initial particles (only called once)
  const createInitialParticles = useCallback((count: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push(createParticle());
    }
    return newParticles;
  }, [createParticle]);

  // Initialize particles only once on first mount
  useEffect(() => {
    if (particlesRef.current.length === 0) {
      particlesRef.current = createInitialParticles(particleCount);
    }
  }, []); // Empty dependency array - only run once

  // Handle particle count changes by preserving existing particles
  useEffect(() => {
    const currentParticles = particlesRef.current;
    const currentCount = currentParticles.length;
    
    if (currentCount < particleCount) {
      // Add new particles to reach the target count
      const particlesToAdd = particleCount - currentCount;
      for (let i = 0; i < particlesToAdd; i++) {
        currentParticles.push(createParticle());
      }
    } else if (currentCount > particleCount) {
      // Remove excess particles (keep the first particleCount particles)
      particlesRef.current = currentParticles.slice(0, particleCount);
    }
  }, [particleCount, createParticle]);

  // Update instanced mesh when particle count changes
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.count = particleCount;
    }
  }, [particleCount]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const matrix = new THREE.Matrix4();
    const cameraPosition = camera.position;
    const particles = particlesRef.current;

    particles.forEach((particle, index) => {
      if (index >= particleCount) return;

      // Calculate the actual rendered size of this particle
      const distance = cameraPosition.distanceTo(particle.position);
      const baseScale = 1.0 * sizeMultiplier;
      const minScale = 0.3 * sizeMultiplier;
      const maxScale = 2.0 * sizeMultiplier;
      const scaleRange = 15; // Distance over which scaling occurs

      // Scale inversely with distance (closer = bigger)
      const scale = Math.max(minScale, Math.min(maxScale, baseScale + (scaleRange - distance) / scaleRange));
      const actualRadius = particleRadius * scale;

      // Update position with speed multiplier
      particle.position.add(particle.velocity.clone().multiplyScalar(delta * speedMultiplier));

      // Bounce off walls and trigger ripple effects (using actual particle size)
      if (particle.position.x > cubeHalf - actualRadius || particle.position.x < -cubeHalf + actualRadius) {
        particle.velocity.x *= -1;
        particle.position.x = Math.max(-cubeHalf + actualRadius, Math.min(cubeHalf - actualRadius, particle.position.x));

        // Trigger ripple effect
        onWallHit(
          particle.position.x > 0 ? 'right' : 'left',
          particle.position.clone()
        );
      }
      if (particle.position.y > cubeHalf - actualRadius || particle.position.y < -cubeHalf + actualRadius) {
        particle.velocity.y *= -1;
        particle.position.y = Math.max(-cubeHalf + actualRadius, Math.min(cubeHalf - actualRadius, particle.position.y));

        // Trigger ripple effect
        onWallHit(
          particle.position.y > 0 ? 'top' : 'bottom',
          particle.position.clone()
        );
      }
      if (particle.position.z > cubeHalf - actualRadius || particle.position.z < -cubeHalf + actualRadius) {
        particle.velocity.z *= -1;
        particle.position.z = Math.max(-cubeHalf + actualRadius, Math.min(cubeHalf - actualRadius, particle.position.z));

        // Trigger ripple effect
        onWallHit(
          particle.position.z > 0 ? 'front' : 'back',
          particle.position.clone()
        );
      }

      // Update instance matrix with position and scale
      matrix.compose(particle.position, new THREE.Quaternion(), new THREE.Vector3(scale, scale, scale));
      meshRef.current!.setMatrixAt(index, matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
      <sphereGeometry args={[particleRadius, 16, 16]} />
      {useLighting ? (
        <meshStandardMaterial 
          color={backgroundColor}
          metalness={0.8}
          roughness={0.5}
          transparent={false}
          opacity={1}
          envMapIntensity={1}
        />
      ) : (
        <meshBasicMaterial color="white" />
      )}
    </instancedMesh>
  );
}; 