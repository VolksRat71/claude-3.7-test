// components/objects/Tree.js
import React, { useMemo } from 'react';
import * as THREE from 'three';

const Tree = ({ position, dayTime }) => {
  // Adjust tree shadow based on time of day
  const shadowLength = useMemo(() => {
    // Shadow is longest at dawn/dusk, shortest at noon/midnight
    const timeOfDay = (dayTime + 0.5) % 1; // Shift so noon is at 0
    return Math.abs(Math.sin(timeOfDay * Math.PI)) * 3 + 1;
  }, [dayTime]);

  return (
    <group position={position}>
      {/* Tree trunk */}
      <mesh castShadow receiveShadow position={[0, 1, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>

      {/* Tree foliage */}
      <mesh castShadow receiveShadow position={[0, 3, 0]}>
        <coneGeometry args={[1.5, 4, 8]} />
        <meshStandardMaterial color="#006400" roughness={0.8} />
      </mesh>

      {/* Tree shadow plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[
          shadowLength * Math.cos((dayTime + 0.25) * Math.PI * 2) * 0.5,
          0.01,
          shadowLength * Math.sin((dayTime + 0.25) * Math.PI * 2) * 0.5
        ]}
        visible={dayTime > 0.25 && dayTime < 0.75} // Only visible during day
      >
        <planeGeometry args={[2 * shadowLength, 1 * shadowLength]} />
        <meshBasicMaterial
          color="#000"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

export default Tree;
