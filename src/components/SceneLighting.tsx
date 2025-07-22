'use client';

import React from 'react';

export const SceneLighting: React.FC = () => {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={2} />
      <pointLight position={[-10, -10, -5]} intensity={1} visible={false} />
    </>
  );
};