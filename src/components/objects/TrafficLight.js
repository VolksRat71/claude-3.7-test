// components/objects/TrafficLight.js
import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

const TrafficLight = ({ position, rotation = [0, 0, 0], state, dayTime }) => {
  const redLightRef = useRef();
  const yellowLightRef = useRef();
  const greenLightRef = useRef();
  const postRef = useRef();

  // Shadow calculation
  const shadowRef = useRef();

  // Update traffic light colors based on state
  useEffect(() => {
    if (redLightRef.current && yellowLightRef.current && greenLightRef.current) {
      redLightRef.current.intensity = state === 'red' ? 1.5 : 0;
      yellowLightRef.current.intensity = state === 'yellow' ? 1.5 : 0;
      greenLightRef.current.intensity = state === 'green' ? 1.5 : 0;
    }
  }, [state]);

  // Adjust light intensity based on time of day
  useFrame(() => {
    const isNight = dayTime < 0.25 || dayTime > 0.75;
    const multiplier = isNight ? 1.5 : 0.8;

    if (redLightRef.current && yellowLightRef.current && greenLightRef.current) {
      if (state === 'red') redLightRef.current.intensity = 1.5 * multiplier;
      if (state === 'yellow') yellowLightRef.current.intensity = 1.5 * multiplier;
      if (state === 'green') greenLightRef.current.intensity = 1.5 * multiplier;
    }

    // Update shadow
    if (shadowRef.current) {
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
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Traffic light pole */}
      <mesh
        ref={postRef}
        castShadow
        receiveShadow
        position={[0, 1.5, 0]}
      >
        <cylinderGeometry args={[0.1, 0.1, 3, 8]} />
        <meshStandardMaterial color="#444" />
      </mesh>

      {/* Traffic light housing */}
      <mesh castShadow receiveShadow position={[0, 3.5, 0]}>
        <boxGeometry args={[0.4, 1.2, 0.4]} />
        <meshStandardMaterial color="#222" />
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

      {/* Red light */}
      <group position={[0, 4, 0]}>
        <mesh>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial
            color={state === 'red' ? "#ff0000" : "#330000"}
            emissive={state === 'red' ? "#ff0000" : "#000"}
            emissiveIntensity={state === 'red' ? 1 : 0}
          />
        </mesh>
        <pointLight ref={redLightRef} color="#ff0000" intensity={0} distance={5} />
      </group>

      {/* Yellow light */}
      <group position={[0, 3.5, 0]}>
        <mesh>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial
            color={state === 'yellow' ? "#ffff00" : "#333300"}
            emissive={state === 'yellow' ? "#ffff00" : "#000"}
            emissiveIntensity={state === 'yellow' ? 1 : 0}
          />
        </mesh>
        <pointLight ref={yellowLightRef} color="#ffff00" intensity={0} distance={5} />
      </group>

      {/* Green light */}
      <group position={[0, 3, 0]}>
        <mesh>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial
            color={state === 'green' ? "#00ff00" : "#003300"}
            emissive={state === 'green' ? "#00ff00" : "#000"}
            emissiveIntensity={state === 'green' ? 1 : 0}
          />
        </mesh>
        <pointLight ref={greenLightRef} color="#00ff00" intensity={0} distance={5} />
      </group>
    </group>
  );
};

export default TrafficLight;
