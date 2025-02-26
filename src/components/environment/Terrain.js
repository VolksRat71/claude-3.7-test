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

  // Create material with basic color and texture variation
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#5a8f3c',
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide,
      vertexColors: true
    });
  }, []);

  // Add vertex colors to create more detail
  useMemo(() => {
    if (!geometry.attributes.position) return;

    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    for (let i = 0; i < positions.count; i++) {
      const x = positions.array[i * 3];
      const y = positions.array[i * 3 + 1];
      const z = positions.array[i * 3 + 2];

      // Vary color based on height and some noise
      const height = y / data.height;
      const noise = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.1;

      // Higher elevation = more brown/rocky
      const r = 0.25 + height * 0.3 + noise;
      const g = 0.35 + height * 0.2 + noise;
      const b = 0.15 + height * 0.05 + noise;

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }, [geometry, data]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      castShadow
    />
  );
};

export default Terrain;
