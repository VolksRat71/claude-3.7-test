
// components/environment/Intersection.js
import React from 'react';

const Intersection = ({ position }) => {
  return (
    <mesh
      position={[position.x, position.y + 0.06, position.z]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[8, 8]} />
      <meshStandardMaterial color="#222" roughness={0.8} />
    </mesh>
  );
};

export default Intersection;
