// components/objects/StreetLight.js
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const StreetLight = ({ position, dayTime }) => {
  const lightRef = useRef();
  const bulbRef = useRef();
  const shadowRef = useRef();

  // Adjust light intensity based on time of day
  useFrame(() => {
    if (lightRef.current && bulbRef.current) {
      const isNight = dayTime < 0.25 || dayTime > 0.75;

      // Light intensity - bright at night, off during day
      const intensity = isNight ? 1.5 : 0;
      lightRef.current.intensity = intensity;

      // Update bulb emissive property
      if (bulbRef.current.material) {
        bulbRef.current.material.emissiveIntensity = isNight ? 1 : 0;
      }

      // Update shadow
      if (shadowRef.current) {
        // Shadow is only visible during day
        const isDaytime = dayTime > 0.25 && dayTime < 0.75;
        shadowRef.current.visible = isDaytime;

        if (isDaytime) {
          // Calculate shadow length and direction based on sun position
          const sunAngle = (dayTime - 0.5) * Math.PI; // 0 at noon, -PI/2 at sunrise, PI/2 at sunset
          const shadowLength = Math.abs(Math.cos(sunAngle)) * 4 + 1;
          const shadowDirection = -Math.sign(Math.cos(sunAngle));

          // Move shadow based on sun position
          shadowRef.current.position.x = shadowDirection * shadowLength * Math.abs(Math.cos(sunAngle));
          shadowRef.current.position.z = shadowDirection * shadowLength * Math.abs(Math.sin(sunAngle));

          // Adjust shadow opacity
          shadowRef.current.material.opacity = 0.3 * Math.sin((dayTime - 0.25) * Math.PI * 2);

          // Scale shadow based on sun height
          shadowRef.current.scale.x = shadowLength * 0.3;
          shadowRef.current.scale.z = shadowLength;
        }
      }
    }
  });

  return (
    <group position={position}>
      {/* Street light pole */}
      <mesh castShadow receiveShadow position={[0, 2, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 4, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.5} roughness={0.2} />
      </mesh>

      {/* Street light arm */}
      <mesh castShadow receiveShadow position={[0.5, 3.8, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#555555" metalness={0.5} roughness={0.2} />
      </mesh>

      {/* Street light fixture */}
      <mesh castShadow receiveShadow position={[1, 3.8, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 0.4, 8]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Light bulb */}
      <mesh ref={bulbRef} position={[1, 3.7, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color="#ffffcc"
          emissive="#ffffcc"
          emissiveIntensity={1}
          toneMapped={false}
        />
      </mesh>

      {/* Pole shadow */}
      <mesh
        ref={shadowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
      >
        <planeGeometry args={[0.2, 4]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>

      {/* Light source */}
      <spotLight
        ref={lightRef}
        position={[1, 3.6, 0]}
        angle={0.6}
        penumbra={0.5}
        intensity={1.5}
        color="#ffffcc"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        distance={15}
        decay={2}
      />
    </group>
  );
};

export default StreetLight;
