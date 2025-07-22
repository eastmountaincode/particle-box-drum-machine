import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Ripple } from './types';

const SEGMENTS = 64; // increased segments for smoother ripple

export const RippleEffect: React.FC<{ ripple: Ripple }> = ({ ripple }) => {
    const lineRef = useRef<THREE.LineLoop>(null);
    const cubeHalf = 2;
    const duration = 3600;

    // Calculate maximum radius based on distance to wall edges
    const maxRadius = useMemo(() => {
        const { wall, position } = ripple;
        let distanceToEdge = cubeHalf;
        
        switch (wall) {
            case 'front':
            case 'back':
                distanceToEdge = Math.min(
                    cubeHalf - Math.abs(position.x),
                    cubeHalf - Math.abs(position.y)
                );
                break;
            case 'left':
            case 'right':
                distanceToEdge = Math.min(
                    cubeHalf - Math.abs(position.z),
                    cubeHalf - Math.abs(position.y)
                );
                break;
            case 'top':
            case 'bottom':
                distanceToEdge = Math.min(
                    cubeHalf - Math.abs(position.x),
                    cubeHalf - Math.abs(position.z)
                );
                break;
        }
        
        return distanceToEdge;
    }, [ripple, cubeHalf]);

    const geometry = useMemo(() => {
        const points: THREE.Vector3[] = [];
        for (let i = 0; i <= SEGMENTS; i++) {
            const angle = (i / SEGMENTS) * Math.PI * 2;
            points.push(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0));
        }
        return new THREE.BufferGeometry().setFromPoints(points);
    }, []);

    const material = useMemo(() => {
        return new THREE.LineBasicMaterial({
            color: 'white',
            transparent: true,
            opacity: 1,
        });
    }, []);

    useFrame(() => {
        if (!lineRef.current) return;

        const elapsed = Date.now() - ripple.startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Expand ripple to calculated maximum radius over full duration
        const radius = progress * maxRadius;
        lineRef.current.scale.set(radius, radius, 1);

        // Handle opacity fade out after 70-80%
        const fadeStart = 0.75;
        material.opacity =
            progress < fadeStart
                ? 1
                : THREE.MathUtils.mapLinear(progress, fadeStart, 1, 1, 0);
        material.needsUpdate = true;

        if (progress >= 1) lineRef.current.visible = false; // Hide after completion
    });

    const wallTransforms = {
        front: { position: [ripple.position.x, ripple.position.y, cubeHalf], rotation: [0, 0, 0] },
        back: { position: [ripple.position.x, ripple.position.y, -cubeHalf], rotation: [0, Math.PI, 0] },
        left: { position: [-cubeHalf, ripple.position.y, ripple.position.z], rotation: [0, Math.PI / 2, 0] },
        right: { position: [cubeHalf, ripple.position.y, ripple.position.z], rotation: [0, -Math.PI / 2, 0] },
        top: { position: [ripple.position.x, cubeHalf, ripple.position.z], rotation: [-Math.PI / 2, 0, 0] },
        bottom: { position: [ripple.position.x, -cubeHalf, ripple.position.z], rotation: [Math.PI / 2, 0, 0] },
    };

    const { position, rotation } = wallTransforms[ripple.wall];

    return (
        <primitive
            ref={lineRef}
            object={new THREE.LineLoop(geometry, material)}
            position={position as [number, number, number]}
            rotation={rotation as [number, number, number]}
        />
    );
};
