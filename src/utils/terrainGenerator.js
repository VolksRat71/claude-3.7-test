// utils/terrainGenerator.js
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export const generateTerrain = (width, depth, height, resolution = 64) => {
  const noise2D = createNoise2D();

  // Generate height map
  const heightMap = [];
  for (let z = 0; z < resolution; z++) {
    heightMap[z] = [];
    for (let x = 0; x < resolution; x++) {
      // Normalize coordinates to -0.5 to 0.5
      const nx = x / resolution - 0.5;
      const nz = z / resolution - 0.5;

      // Generate noise at different frequencies
      const frequency1 = 1.5;
      const frequency2 = 3.0;
      const frequency3 = 6.0;

      const noise1 = noise2D(nx * frequency1, nz * frequency1) * 0.5;
      const noise2 = noise2D(nx * frequency2, nz * frequency2) * 0.25;
      const noise3 = noise2D(nx * frequency3, nz * frequency3) * 0.125;

      // Combine noise values
      let h = noise1 + noise2 + noise3;

      // Create two hills
      const hill1 = createHill(nx + 0.3, nz + 0.2, 0.2, 1.0);
      const hill2 = createHill(nx - 0.3, nz - 0.2, 0.25, 0.8);

      h += hill1 + hill2;

      // Create a valley/path between hills for the road
      const roadPath = createRoadPath(nx, nz, 0.07);
      h = applyRoadPath(h, roadPath, 0.8);

      // Scale height
      h *= height;

      heightMap[z][x] = h;
    }
  }

  // Function to get interpolated height at any point
  const getHeightAt = (x, z) => {
    // Convert world coordinates to heightmap indices
    const nx = ((x / width) + 0.5) * (resolution - 1);
    const nz = ((z / depth) + 0.5) * (resolution - 1);

    // Clamp to valid range
    const ix0 = Math.max(0, Math.min(Math.floor(nx), resolution - 2));
    const iz0 = Math.max(0, Math.min(Math.floor(nz), resolution - 2));
    const ix1 = ix0 + 1;
    const iz1 = iz0 + 1;

    // Calculate interpolation weights
    const wx = nx - ix0;
    const wz = nz - iz0;

    // Bilinear interpolation of heights
    if (!heightMap[iz0] || !heightMap[iz1]) return 0;

    const h00 = heightMap[iz0][ix0] || 0;
    const h10 = heightMap[iz0][ix1] || 0;
    const h01 = heightMap[iz1][ix0] || 0;
    const h11 = heightMap[iz1][ix1] || 0;

    const h0 = h00 * (1 - wx) + h10 * wx;
    const h1 = h01 * (1 - wx) + h11 * wx;

    return h0 * (1 - wz) + h1 * wz;
  };

  // Function to get normal at any point
  const getNormalAt = (x, z) => {
    const delta = 0.5;

    const hCenter = getHeightAt(x, z);
    const hRight = getHeightAt(x + delta, z);
    const hUp = getHeightAt(x, z + delta);

    // Calculate tangent vectors
    const tangentX = new THREE.Vector3(delta, hRight - hCenter, 0).normalize();
    const tangentZ = new THREE.Vector3(0, hUp - hCenter, delta).normalize();

    // Calculate normal using cross product
    return new THREE.Vector3().crossVectors(tangentZ, tangentX).normalize();
  };

  return {
    width,
    depth,
    height,
    resolution,
    heightMap,
    getHeightAt,
    getNormalAt
  };
};

// Helper function to create a hill shape
const createHill = (x, z, radius, height) => {
  const distance = Math.sqrt(x * x + z * z);
  if (distance < radius) {
    // Smooth falloff at edges using cosine function
    const falloff = 0.5 * (1 + Math.cos(Math.PI * distance / radius));
    return falloff * height;
  }
  return 0;
};

// Helper function to create a path for the road
const createRoadPath = (x, z, width) => {
  // Figure-8 path
  const t = Math.atan2(z, x);
  const r1 = 0.3; // Main radius
  const r2 = 0.2; // Secondary radius

  // Parametric equation for figure-8
  const pathX = Math.sin(t) * r1;
  const pathZ = Math.sin(2 * t) * r2;

  // Calculate distance to path
  const distance = Math.sqrt(Math.pow(x - pathX, 2) + Math.pow(z - pathZ, 2));

  // Return distance to path
  return {
    distance,
    width,
    height: 0  // Road is flat
  };
};

// Apply road path by flattening terrain
const applyRoadPath = (height, path, strength) => {
  if (path.distance < path.width) {
    // Calculate smoothing factor (1 at center, 0 at edge)
    const smoothFactor = 1 - (path.distance / path.width);

    // Smoothly blend between original height and path height
    return height * (1 - smoothFactor * strength) + path.height * smoothFactor * strength;
  }
  return height;
};
