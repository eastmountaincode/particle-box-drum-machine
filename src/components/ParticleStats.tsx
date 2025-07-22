'use client';

import React from 'react';
import { ParticleStatsProps } from './types';

export const ParticleStats: React.FC<ParticleStatsProps> = ({ speed, size, count }) => {
  return (
    <div className="absolute top-4 left-4 z-10 text-white space-y-1">
      <div>Speed: {speed.toFixed(2)}x</div>
      <div>Size: {size.toFixed(2)}x</div>
      <div>Count: {count}</div>
    </div>
  );
};