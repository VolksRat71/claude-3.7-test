// components/environment/Intersection.js
import React, { useMemo } from 'react';
import * as THREE from 'three';

const Intersection = ({ position }) => {
  // Create asphalt texture for intersection
  const intersectionTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');

    // Fill with dark gray base
    context.fillStyle = '#222222';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Add some noise/texture for asphalt look
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 2 + 0.5;
      const brightness = Math.random() * 20 + 10;

      context.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      context.fillRect(x, y, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  return (
    <group position={[position.x, position.y + 0.06, position.z]}>
      {/* Intersection surface - larger to ensure full coverage */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial
          map={intersectionTexture}
          color="#555555"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Crosswalk lines on intersection */}
      {[...Array(8)].map((_, i) => (
        <React.Fragment key={`crosswalk-x-${i}`}>
          {/* X-axis crosswalk */}
          <mesh
            position={[-3 + i, 0.01, 3.5]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.6, 2]} />
            <meshStandardMaterial color="white" />
          </mesh>

          {/* Z-axis crosswalk */}
          <mesh
            position={[3.5, 0.01, -3 + i]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[2, 0.6]} />
            <meshStandardMaterial color="white" />
          </mesh>

          {/* Additional crosswalks for other sides */}
          <mesh
            position={[-3 + i, 0.01, -3.5]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.6, 2]} />
            <meshStandardMaterial color="white" />
          </mesh>

          <mesh
            position={[-3.5, 0.01, -3 + i]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[2, 0.6]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </React.Fragment>
      ))}

      {/* Stop lines */}
      <mesh
        position={[0, 0.01, 4.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[8, 0.4]} />
        <meshStandardMaterial color="white" />
      </mesh>

      <mesh
        position={[0, 0.01, -4.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[8, 0.4]} />
        <meshStandardMaterial color="white" />
      </mesh>

      <mesh
        position={[4.5, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.4, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>

      <mesh
        position={[-4.5, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.4, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  );
};

export default Intersection;
