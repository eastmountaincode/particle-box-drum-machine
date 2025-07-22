import React from 'react';
import { RippleEffect } from './RippleEffect';
import { Ripple } from './types';

export const Ripples: React.FC<{ ripples: Ripple[] }> = ({ ripples }) => {
  return (
    <group>
      {ripples.map((ripple) => (
        <RippleEffect key={ripple.id} ripple={ripple} />
      ))}
    </group>
  );
}; 