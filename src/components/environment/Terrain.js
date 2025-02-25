// components/environment/Terrain.js
import React, { useMemo } from 'react';
import * as THREE from 'three';

const Terrain = ({ data }) => {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      data.width,
      data.depth,
      data.resolution - 1,
      data.resolution - 1
    );

    // Apply height data
    const vertices = geo.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      vertices[i + 1] = data.getHeightAt(x, z);
    }

    geo.computeVertexNormals();
    return geo;
  }, [data]);

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <meshStandardMaterial
        color="#5a8f3c"
        roughness={0.8}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default Terrain;
