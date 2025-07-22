import React from 'react';
import * as THREE from 'three';

interface EdgeOnlyCubeProps {
  flashingWalls?: Set<string>;
}

export const EdgeOnlyCube: React.FC<EdgeOnlyCubeProps> = ({ flashingWalls = new Set() }) => {
  const cubeSize = 2.5;
  const half = cubeSize / 2;
  
  // Define the 12 edges of a cube (wireframe)
  const edges = [
    // Front face (4 edges)
    [[-half, -half, half], [half, -half, half]], // bottom
    [[half, -half, half], [half, half, half]],   // right
    [[half, half, half], [-half, half, half]],   // top
    [[-half, half, half], [-half, -half, half]], // left
    
    // Back face (4 edges)
    [[-half, -half, -half], [half, -half, -half]], // bottom
    [[half, -half, -half], [half, half, -half]],   // right
    [[half, half, -half], [-half, half, -half]],   // top
    [[-half, half, -half], [-half, -half, -half]], // left
    
    // Connecting edges (4 edges)
    [[-half, -half, -half], [-half, -half, half]], // bottom-left
    [[half, -half, -half], [half, -half, half]],   // bottom-right
    [[half, half, -half], [half, half, half]],     // top-right
    [[-half, half, -half], [-half, half, half]],   // top-left
  ];

  // Create line geometry from edge points
  const points: THREE.Vector3[] = [];
  edges.forEach(([start, end]) => {
    points.push(new THREE.Vector3(start[0], start[1], start[2]));
    points.push(new THREE.Vector3(end[0], end[1], end[2]));
  });

  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  // Define wall panels
  const wallPanels = [
    { name: 'front', position: [0, 0, half], rotation: [0, 0, 0] },
    { name: 'back', position: [0, 0, -half], rotation: [0, Math.PI, 0] },
    { name: 'right', position: [half, 0, 0], rotation: [0, Math.PI / 2, 0] },
    { name: 'left', position: [-half, 0, 0], rotation: [0, -Math.PI / 2, 0] },
    { name: 'top', position: [0, half, 0], rotation: [-Math.PI / 2, 0, 0] },
    { name: 'bottom', position: [0, -half, 0], rotation: [Math.PI / 2, 0, 0] }
  ];

  return (
    <group>
      {/* Wireframe edges */}
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color="white" />
      </lineSegments>
      
      {/* Wall panels */}
      {wallPanels.map(({ name, position, rotation }) => {
        const isFlashing = flashingWalls.has(name);
        
        return (
          <mesh
            key={name}
            position={position as [number, number, number]}
            rotation={rotation as [number, number, number]}
          >
            <planeGeometry args={[cubeSize, cubeSize]} />
            <meshBasicMaterial 
              color={isFlashing ? '#ffffff' : '#ffffff'} 
              opacity={isFlashing ? 0.4 : 0} 
              transparent={true}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}; 