import * as THREE from 'three';

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
}

export interface ParticleParams {
  speed: number;
  size: number;
}

export interface WallHitHandler {
  (wall: string, position: THREE.Vector3): void;
}

export interface ParticleBoxProps {
  useLighting?: boolean;
  particleCount?: number;
  onWallHit?: () => void; // Add this for quantization hits
  trackIndex?: number;
}

export interface ParticleStatsProps {
  speed: number;
  size: number;
  count: number;
}

export interface CameraTrackerProps {
  onParamsChange: (params: ParticleParams) => void;
  speedRange: [number, number];
  sizeRange: [number, number];
}

export interface ParticleSceneProps {
  particleParams: ParticleParams;
  onParamsChange: (params: ParticleParams) => void;
  flashingWalls: Set<string>;
  onWallHit: WallHitHandler;
  particleCount: number;
  useLighting: boolean;
  speedRange: [number, number];
  sizeRange: [number, number];
  trackIndex?: number;
}