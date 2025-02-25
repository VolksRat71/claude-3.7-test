// utils/roadGenerator.js
import * as THREE from 'three';

export const generateRoadPath = (terrain) => {
  const points = [];
  const numPoints = 100;
  const radius = 35;

  // Create a curved road between the hills
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;

    // Base shape is a figure-8
    const x = Math.sin(angle) * radius * 0.6;
    const z = Math.sin(angle * 2) * radius * 0.3;

    // Get height from terrain
    const y = terrain.getHeightAt(x, z) + 0.1; // Slightly above terrain

    // Mark points near the bottom as intersection
    const isIntersection = Math.abs(z) < 1 && x > -5 && x < 5;

    points.push({ x, y, z, isIntersection });
  }

  // Define intersection position
  const intersection = { x: 0, y: terrain.getHeightAt(0, 0) + 0.1, z: 0 };

  return {
    points,
    intersection
  };
};
