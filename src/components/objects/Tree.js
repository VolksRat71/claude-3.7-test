// components/objects/Tree.js
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Tree = ({ position, dayTime }) => {
  const treeRef = useRef();
  const shadowRef = useRef();

  // Create an animated material for leaves that subtly moves in the wind
  const leafMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#006400",
      roughness: 0.8
    });
  }, []);

  // Random tree height and width variations
  const treeScale = useMemo(() => {
    return {
      height: 0.8 + Math.random() * 0.4,
      width: 0.9 + Math.random() * 0.2
    };
  }, []);

  // Animate tree leaves slightly
  useFrame((state) => {
    if (treeRef.current) {
      // Subtle swaying based on time
      const windStrength = 0.001;
      const windFrequency = 1.5;
      treeRef.current.rotation.z = Math.sin(state.clock.elapsedTime * windFrequency) * windStrength;

      // Update shadow position and opacity based on time of day
      if (shadowRef.current) {
        // Shadow is visible only during daytime
        const isDaytime = dayTime > 0.25 && dayTime < 0.75;
        shadowRef.current.visible = isDaytime;

        if (isDaytime) {
          // Calculate shadow length and direction based on sun position
          const sunAngle = (dayTime - 0.5) * Math.PI; // 0 at noon, -PI/2 at sunrise, PI/2 at sunset
          const shadowLength = Math.abs(Math.cos(sunAngle)) * 3 + 1;
          const shadowDirection = -Math.sign(Math.cos(sunAngle));

          // Move shadow based on sun position
          shadowRef.current.position.x = shadowDirection * shadowLength * Math.abs(Math.cos(sunAngle));
          shadowRef.current.position.z = shadowDirection * shadowLength * Math.abs(Math.sin(sunAngle));

          // Adjust shadow opacity (darkest at noon, lighter at dawn/dusk)
          shadowRef.current.material.opacity = 0.3 * Math.sin((dayTime - 0.25) * Math.PI * 2);

          // Scale shadow based on sun height
          shadowRef.current.scale.set(shadowLength, 1, shadowLength * 0.5);
        }
      }
    }
  });

  return (
    <group position={position}>
      {/* Tree trunk */}
      <mesh castShadow receiveShadow position={[0, 1 * treeScale.height, 0]}>
        <cylinderGeometry args={[0.2 * treeScale.width, 0.3 * treeScale.width, 2 * treeScale.height, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>

      {/* Tree foliage */}
      <group ref={treeRef} position={[0, 3 * treeScale.height, 0]}>
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <coneGeometry args={[1.5 * treeScale.width, 4 * treeScale.height, 8]} />
          <primitive object={leafMaterial} />
        </mesh>
      </group>

      {/* Tree shadow on ground */}
      <mesh
        ref={shadowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        receiveShadow={false}
        castShadow={false}
      >
        <planeGeometry args={[2, 1]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

export default Tree;
