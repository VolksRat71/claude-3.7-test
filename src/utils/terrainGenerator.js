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

    // Calculate grid cell indices
    const ix0 = Math.floor(nx);
    const iz0 = Math.floor(nz);
    const ix1 = Math.min(ix0 + 1, resolution - 1);
    const iz1 = Math.min(iz0 + 1, resolution - 1);

    // Calculate interpolation weights
    const wx = nx - ix0;
    const wz = nz - iz0;

    // Bilinear interpolation of heights
    let h00 = heightMap[iz0]?.[ix0] ?? 0;
    let h10 = heightMap[iz0]?.[ix1] ?? 0;
    let h01 = heightMap[iz1]?.[ix0] ?? 0;
    let h11 = heightMap[iz1]?.[ix1] ?? 0;

    const h0 = h00 * (1 - wx) + h10 * wx;
    const h1 = h01 * (1 - wx) + h11 * wx;

    return h0 * (1 - wz) + h1 * wz;
  };

  return {
    width,
    depth,
    height,
    resolution,
    heightMap,
    getHeightAt
  };
};

// Helper function to create a hill shape
const createHill = (x, z, radius, height) => {
  const distance = Math.sqrt(x * x + z * z);
  if (distance < radius) {
    // Smooth falloff at edges
    const falloff = 1 - Math.pow(distance / radius, 2);
    return falloff * height;
  }
  return 0;
};
