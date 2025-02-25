// components/objects/Car.js
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const Car = ({
  initialPosition,
  path,
  initialPathIndex,
  speed,
  trafficLightState,
  intersectionPosition,
  dayTime
}) => {
  const meshRef = useRef();
  const headlightsRef = useRef();
  const taillightsRef = useRef();
  const [pathIndex, setPathIndex] = useState(initialPathIndex);
  const [carPosition, setCarPosition] = useState(new THREE.Vector3(...initialPosition));
  const [carRotation, setCarRotation] = useState(new THREE.Euler(0, 0, 0));

  // Load car model with useGLTF
  const { scene } = useGLTF('/models/car.glb');

  // Determine if car should stop at intersection
  const isNearIntersection = () => {
    const distance = carPosition.distanceTo(
      new THREE.Vector3(intersectionPosition.x, intersectionPosition.y, intersectionPosition.z)
    );
    return distance < 5;
  };

  // Car movement logic
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Check if should stop at red light
    const shouldStop = trafficLightState === 'red' && isNearIntersection();

    if (!shouldStop) {
      // Move along path
      const currentPoint = path.points[pathIndex];
      const nextIndex = (pathIndex + 1) % path.points.length;
      const nextPoint = path.points[nextIndex];

      // Calculate direction to next point
      const direction = new THREE.Vector3(
        nextPoint.x - currentPoint.x,
        nextPoint.y - currentPoint.y,
        nextPoint.z - currentPoint.z
      ).normalize();

      // Move car
      const moveDistance = speed * delta;
      const newPosition = carPosition.clone().add(direction.multiplyScalar(moveDistance));

      // Calculate distance to next point
      const distanceToNextPoint = newPosition.distanceTo(
        new THREE.Vector3(nextPoint.x, nextPoint.y, nextPoint.z)
      );

      // If reached next point, update path index
      if (distanceToNextPoint < moveDistance) {
        setPathIndex(nextIndex);
      }

      // Update car position
      setCarPosition(newPosition);

      // Calculate orientation based on path (yaw, pitch, roll)
      // Yaw (rotation around Y axis)
      const yaw = Math.atan2(direction.x, direction.z);

      // Pitch (rotation around X axis) based on terrain slope
      const terrainNormal = new THREE.Vector3(0, 1, 0); // Simplified
      const pitch = Math.acos(direction.dot(terrainNormal)) - Math.PI / 2;

      // Roll (rotation around Z axis) based on road banking
      const roll = 0; // Simplified, would calculate based on road curve

      setCarRotation(new THREE.Euler(pitch, yaw, roll));
    }

    // Update car position and rotation
    meshRef.current.position.copy(carPosition);
    meshRef.current.rotation.copy(carRotation);

    // Update car lights based on time of day
    const isNight = dayTime < 0.25 || dayTime > 0.75;

    if (headlightsRef.current && taillightsRef.current) {
      // Headlights
      headlightsRef.current.intensity = isNight ? 1 : 0;

      // Taillights (always on but brighter at night)
      taillightsRef.current.intensity = isNight ? 0.8 : 0.3;
    }
  });

  return (
    <group ref={meshRef} position={carPosition.toArray()} rotation={carRotation.toArray()}>
      {/* Car model */}
      <primitive object={scene.clone()} scale={[0.5, 0.5, 0.5]} />

      {/* Headlights */}
      <spotLight
        ref={headlightsRef}
        position={[0, 0.5, 1.5]}
        angle={0.3}
        penumbra={0.5}
        intensity={0}
        color="#fff"
        castShadow
        distance={10}
      />

      {/* Taillights */}
      <pointLight
        ref={taillightsRef}
        position={[0, 0.5, -1.5]}
        intensity={0.3}
        color="#ff0000"
        distance={5}
      />
    </group>
  );
};

export default Car;
