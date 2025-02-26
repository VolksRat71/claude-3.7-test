// components/Scene.js - Main scene container
import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import Terrain from './environment/Terrain';
import Road from './environment/Road';
import Intersection from './environment/Intersection';
import Car from './objects/Car';
import Tree from './objects/Tree';
import TrafficLight from './objects/TrafficLight';
import StreetLight from './objects/StreetLight';
import { generateTerrain } from '../utils/terrainGenerator';
import { generateRoadPath } from '../utils/roadGenerator';

// Constants
const DAY_CYCLE_DURATION = 60; // seconds for a full day
const CAR_COUNT = 5;
const TREE_COUNT = 20;
const STREET_LIGHT_COUNT = 10;

const Scene = () => {
  const { scene } = useThree();
  const sceneRef = useRef();
  const timeRef = useRef(0);
  const [dayTime, setDayTime] = useState(0.5); // 0-1 represents time of day, start at mid-day
  const [terrainData, setTerrainData] = useState(null);
  const [roadPath, setRoadPath] = useState(null);
  const [trafficLightState, setTrafficLightState] = useState('red');
  const lightRef = useRef();

  // Generate terrain and road data on mount
  useEffect(() => {
    const terrain = generateTerrain(100, 100, 15);
    setTerrainData(terrain);

    const road = generateRoadPath(terrain);
    setRoadPath(road);
  }, []);

  // Traffic light cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setTrafficLightState(prev => {
        if (prev === 'red') return 'green';
        if (prev === 'green') return 'yellow';
        return 'red';
      });
    }, 5000); // 5 seconds per light

    return () => clearInterval(interval);
  }, []);

  // Day-night cycle management
  useFrame((state, delta) => {
    timeRef.current += delta;
    const newDayTime = (timeRef.current % DAY_CYCLE_DURATION) / DAY_CYCLE_DURATION;
    setDayTime(newDayTime);

    // Update ambient light intensity based on time of day
    if (lightRef.current) {
      // Calculate light intensity based on time (brightest at noon, darkest at midnight)
      const intensity = Math.sin(newDayTime * Math.PI) * 0.5 + 0.5;
      lightRef.current.intensity = 0.2 + intensity * 0.8;

      // Update directional light position to simulate sun movement
      const sunAngle = newDayTime * Math.PI * 2;
      const sunRadius = 50;
      lightRef.current.position.x = Math.cos(sunAngle) * sunRadius;
      lightRef.current.position.y = Math.abs(Math.sin(sunAngle) * sunRadius) + 5; // Keep sun above horizon
      lightRef.current.position.z = 0;
    }
  });

  // Early return if data isn't loaded
  if (!terrainData || !roadPath) return null;

  // Place trees based on terrain (away from roads)
  const treePositions = [];
  for (let i = 0; i < TREE_COUNT; i++) {
    const x = Math.random() * 80 - 40;
    const z = Math.random() * 80 - 40;

    // Make sure trees are not too close to the road
    const minDistanceToRoad = 5;
    const isNearRoad = roadPath.points.some(point => {
      const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.z - z, 2));
      return distance < minDistanceToRoad;
    });

    if (!isNearRoad) {
      // Get actual height from terrain
      const y = terrainData.getHeightAt(x, z);
      treePositions.push({ x, y, z });
    }
  }

  // Place street lights along the road
  const streetLightPositions = [];
  for (let i = 0; i < STREET_LIGHT_COUNT; i++) {
    const pathIndex = Math.floor(Math.random() * roadPath.points.length);
    const point = roadPath.points[pathIndex];

    // Offset from road center
    const nextPoint = roadPath.points[(pathIndex + 1) % roadPath.points.length];
    const direction = new THREE.Vector2(
      nextPoint.x - point.x,
      nextPoint.z - point.z
    ).normalize();

    // Place light on side of road (perpendicular to direction)
    const perpendicular = new THREE.Vector2(-direction.y, direction.x);
    const offset = 3; // Distance from road center

    streetLightPositions.push({
      x: point.x + perpendicular.x * offset,
      y: point.y,
      z: point.z + perpendicular.y * offset
    });
  }

  // Generate car starting positions and paths
  const carData = [];
  for (let i = 0; i < CAR_COUNT; i++) {
    const startIndex = Math.floor(Math.random() * roadPath.points.length);
    carData.push({
      id: i,
      startPosition: roadPath.points[startIndex],
      pathIndex: startIndex,
      speed: 0.1 + Math.random() * 0.2,
    });
  }

  return (
    <group ref={sceneRef}>
      {/* Sky with day/night cycle */}
      <Sky sunPosition={[
        Math.cos(dayTime * Math.PI * 2) * 100,
        Math.sin(dayTime * Math.PI * 2) * 100,
        0
      ]} />

      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight
        ref={lightRef}
        intensity={1}
        position={[0, 10, 0]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.0001}
      />

      {/* Environment */}
      <Terrain data={terrainData} />
      <Road path={roadPath} terrain={terrainData} />
      <Intersection position={roadPath.intersection} />

      {/* Trees */}
      {treePositions.map((pos, index) => (
        <Tree
          key={`tree-${index}`}
          position={[pos.x, pos.y, pos.z]}
          dayTime={dayTime}
        />
      ))}

      {/* Street Lights */}
      {streetLightPositions.map((pos, index) => (
        <StreetLight
          key={`street-light-${index}`}
          position={[pos.x, pos.y, pos.z]}
          dayTime={dayTime}
        />
      ))}

      {/* Traffic lights */}
      <TrafficLight
        position={[
          roadPath.intersection.x + 3,
          roadPath.intersection.y,
          roadPath.intersection.z
        ]}
        state={trafficLightState}
        dayTime={dayTime}
      />
      <TrafficLight
        position={[
          roadPath.intersection.x,
          roadPath.intersection.y,
          roadPath.intersection.z + 3
        ]}
        rotation={[0, Math.PI/2, 0]}
        state={trafficLightState === 'red' ? 'green' : trafficLightState === 'green' ? 'red' : 'yellow'}
        dayTime={dayTime}
      />

      {/* Cars */}
      {carData.map(car => (
        <Car
          key={`car-${car.id}`}
          initialPosition={[car.startPosition.x, car.startPosition.y, car.startPosition.z]}
          path={roadPath}
          terrain={terrainData}
          initialPathIndex={car.pathIndex}
          speed={car.speed}
          trafficLightState={trafficLightState}
          intersectionPosition={roadPath.intersection}
          dayTime={dayTime}
        />
      ))}
    </group>
  );
};

export default Scene;
