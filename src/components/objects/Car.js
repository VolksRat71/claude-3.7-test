// components/objects/Car.js
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Car = ({
  initialPosition,
  path,
  terrain,
  initialPathIndex,
  speed,
  trafficLightState,
  intersectionPosition,
  dayTime
}) => {
  const carRef = useRef();
  const wheelsRef = useRef([]);
  const headlightsRef = useRef([]);
  const taillightsRef = useRef([]);

  const [pathIndex, setPathIndex] = useState(initialPathIndex);
  const [carPosition, setCarPosition] = useState(new THREE.Vector3(...initialPosition));
  const [carRotation, setCarRotation] = useState(new THREE.Euler(0, 0, 0));
  const [wheelRotation, setWheelRotation] = useState(0);

  // Generate random car color
  const carColor = useMemo(() => {
    const colors = ['#ff0000', '#0000ff', '#00ff00', '#ffff00', '#ffffff', '#000000', '#ffa500'];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  // Determine if car should stop at intersection
  const isNearIntersection = () => {
    const distance = carPosition.distanceTo(
      new THREE.Vector3(intersectionPosition.x, intersectionPosition.y, intersectionPosition.z)
    );
    return distance < 5;
  };

  // Calculate surface normal at a point for proper car orientation
  const getSurfaceNormal = (x, z) => {
    if (!terrain) return new THREE.Vector3(0, 1, 0);

    const delta = 0.5;
    const centerHeight = terrain.getHeightAt(x, z);
    const northHeight = terrain.getHeightAt(x, z + delta);
    const eastHeight = terrain.getHeightAt(x + delta, z);

    const northVector = new THREE.Vector3(0, northHeight - centerHeight, delta).normalize();
    const eastVector = new THREE.Vector3(delta, eastHeight - centerHeight, 0).normalize();

    return new THREE.Vector3().crossVectors(eastVector, northVector).normalize();
  };

  // Car movement logic
  useFrame((state, delta) => {
    if (!carRef.current || !terrain) return;

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

      // Adjust height based on terrain
      newPosition.y = terrain.getHeightAt(newPosition.x, newPosition.z) + 0.2; // Slightly above ground

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

      // Get surface normal at car position for orientation
      const normal = getSurfaceNormal(newPosition.x, newPosition.z);

      // Calculate orientation based on path and terrain (yaw, pitch, roll)
      // Yaw (rotation around Y axis) - direction of travel
      const yaw = Math.atan2(direction.x, direction.z);

      // Create rotation matrix from surface normal
      const rotationMatrix = new THREE.Matrix4();
      const up = new THREE.Vector3(0, 1, 0);

      // Find the axis and angle to rotate from up vector to normal
      const axis = new THREE.Vector3().crossVectors(up, normal).normalize();
      const angle = Math.acos(up.dot(normal));

      // Set car rotation
      const newRotation = new THREE.Euler();
      newRotation.set(0, yaw, 0); // Start with yaw

      // Apply pitch and roll based on terrain normal
      if (axis.length() > 0.001) {
        const quaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle);
        const yawQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
        quaternion.multiply(yawQuaternion);
        newRotation.setFromQuaternion(quaternion);
      }

      setCarRotation(newRotation);

      // Rotate wheels
      setWheelRotation(prev => prev - moveDistance * 3);
    }

    // Update car position and rotation
    if (carRef.current) {
      carRef.current.position.copy(carPosition);
      carRef.current.rotation.copy(carRotation);
    }

    // Rotate wheels
    if (wheelsRef.current) {
      wheelsRef.current.forEach(wheel => {
        if (wheel) wheel.rotation.x = wheelRotation;
      });
    }

    // Update car lights based on time of day
    const isNight = dayTime < 0.25 || dayTime > 0.75;

    // Headlights
    if (headlightsRef.current) {
      headlightsRef.current.forEach(light => {
        if (light) light.intensity = isNight ? 1.5 : 0;
      });
    }

    // Taillights
    if (taillightsRef.current) {
      taillightsRef.current.forEach(light => {
        if (light) light.intensity = isNight ? 0.8 : 0.3;
      });
    }
  });

  return (
    <group ref={carRef} position={carPosition.toArray()} rotation={carRotation.toArray()}>
      {/* Car body */}
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[1.8, 0.6, 4]} />
        <meshStandardMaterial color={carColor} metalness={0.5} roughness={0.2} />
      </mesh>

      {/* Car cabin/top */}
      <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[1.5, 0.5, 2.5]} />
        <meshStandardMaterial color={carColor} metalness={0.5} roughness={0.2} />
      </mesh>

      {/* Wheels - correctly oriented on X axis for rotation */}
      <mesh
        castShadow
        position={[0.9, 0.3, 1.2]}
        ref={el => { wheelsRef.current[0] = el }}
      >
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} rotation={[0, 0, Math.PI/2]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh
        castShadow
        position={[-0.9, 0.3, 1.2]}
        ref={el => { wheelsRef.current[1] = el }}
      >
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} rotation={[0, 0, Math.PI/2]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh
        castShadow
        position={[0.9, 0.3, -1.2]}
        ref={el => { wheelsRef.current[2] = el }}
      >
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} rotation={[0, 0, Math.PI/2]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh
        castShadow
        position={[-0.9, 0.3, -1.2]}
        ref={el => { wheelsRef.current[3] = el }}
      >
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} rotation={[0, 0, Math.PI/2]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Windows */}
      <mesh castShadow position={[0, 0.9, 1.0]}>
        <boxGeometry args={[1.4, 0.4, 0.1]} />
        <meshStandardMaterial color="#aaddff" opacity={0.7} transparent />
      </mesh>
      <mesh castShadow position={[0, 0.9, -1.0]}>
        <boxGeometry args={[1.4, 0.4, 0.1]} />
        <meshStandardMaterial color="#aaddff" opacity={0.7} transparent />
      </mesh>

      {/* Headlights */}
      <mesh position={[0.6, 0.4, 2.0]}>
        <boxGeometry args={[0.3, 0.2, 0.1]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={dayTime < 0.25 || dayTime > 0.75 ? 1 : 0}
        />
      </mesh>
      <mesh position={[-0.6, 0.4, 2.0]}>
        <boxGeometry args={[0.3, 0.2, 0.1]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={dayTime < 0.25 || dayTime > 0.75 ? 1 : 0}
        />
      </mesh>

      {/* Taillights */}
      <mesh position={[0.6, 0.4, -2.0]}>
        <boxGeometry args={[0.3, 0.2, 0.1]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.6, 0.4, -2.0]}>
        <boxGeometry args={[0.3, 0.2, 0.1]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>

      {/* Headlights - Light sources */}
      <spotLight
        ref={el => { headlightsRef.current[0] = el }}
        position={[0.6, 0.5, 2.0]}
        angle={0.3}
        penumbra={0.5}
        intensity={0}
        color="#ffffff"
        castShadow
        distance={15}
      />
      <spotLight
        ref={el => { headlightsRef.current[1] = el }}
        position={[-0.6, 0.5, 2.0]}
        angle={0.3}
        penumbra={0.5}
        intensity={0}
        color="#ffffff"
        castShadow
        distance={15}
      />

      {/* Taillights - Light sources */}
      <pointLight
        ref={el => { taillightsRef.current[0] = el }}
        position={[0.6, 0.5, -2.0]}
        intensity={0.3}
        color="#ff0000"
        distance={5}
      />
      <pointLight
        ref={el => { taillightsRef.current[1] = el }}
        position={[-0.6, 0.5, -2.0]}
        intensity={0.3}
        color="#ff0000"
        distance={5}
      />
    </group>
  );
};

export default Car;
