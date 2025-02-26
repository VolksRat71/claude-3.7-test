// utils/roadGenerator.js
import * as THREE from 'three';

export const generateRoadPath = (terrain) => {
  const points = [];
  const numPoints = 100;

  // Create a figure-8 road path
  for (let i = 0; i < numPoints; i++) {
    const t = (i / numPoints) * Math.PI * 2;

    // Parametric equation for a figure-8
    const r1 = 35;  // Main radius
    const r2 = 15;  // Secondary radius

    // Calculate position on figure-8
    const x = Math.sin(t) * r1 * 0.6;
    const z = Math.sin(t * 2) * r2 * 0.6;

    // Get terrain height at this position, plus a small offset
    const y = terrain.getHeightAt(x, z) + 0.1; // Slightly above terrain

    // Mark points near the center as the intersection
    const isNearCenter = Math.abs(x) < 5 && Math.abs(z) < 5;
    const isIntersection = isNearCenter;

    // Calculate normal at this point for road banking
    const normal = terrain.getNormalAt(x, z);

    // Store all road point data
    points.push({
      x,
      y,
      z,
      isIntersection,
      normal: {
        x: normal.x,
        y: normal.y,
        z: normal.z
      }
    });
  }

  // Define the intersection position
  const intersection = {
    x: 0,
    y: terrain.getHeightAt(0, 0) + 0.1,
    z: 0
  };

  // Calculate tangents for smooth car movement
  const tangents = [];
  for (let i = 0; i < points.length; i++) {
    const nextIdx = (i + 1) % points.length;
    const prevIdx = (i - 1 + points.length) % points.length;

    // Calculate forward direction (using next point)
    const forwardDir = new THREE.Vector3(
      points[nextIdx].x - points[i].x,
      points[nextIdx].y - points[i].y,
      points[nextIdx].z - points[i].z
    ).normalize();

    // Calculate backward direction (using previous point)
    const backwardDir = new THREE.Vector3(
      points[i].x - points[prevIdx].x,
      points[i].y - points[prevIdx].y,
      points[i].z - points[prevIdx].z
    ).normalize();

    // Calculate tangent as average of forward and backward
    const tangent = new THREE.Vector3()
      .addVectors(forwardDir, backwardDir)
      .normalize();

    tangents.push({
      x: tangent.x,
      y: tangent.y,
      z: tangent.z
    });
  }

  // Calculate curvature for each point (for car banking)
  const curvatures = [];
  for (let i = 0; i < points.length; i++) {
    const nextIdx = (i + 1) % points.length;
    const prevIdx = (i - 1 + points.length) % points.length;

    // Get three consecutive points
    const p0 = new THREE.Vector3(points[prevIdx].x, points[prevIdx].y, points[prevIdx].z);
    const p1 = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
    const p2 = new THREE.Vector3(points[nextIdx].x, points[nextIdx].y, points[nextIdx].z);

    // Calculate vectors between points
    const v1 = new THREE.Vector3().subVectors(p1, p0);
    const v2 = new THREE.Vector3().subVectors(p2, p1);

    // Angle between vectors gives curvature approximation
    const angle = v1.angleTo(v2);

    // Cross product determines direction of curvature
    const cross = new THREE.Vector3().crossVectors(v1, v2);
    const curvatureSign = Math.sign(cross.y);

    // Store curvature (positive for right turns, negative for left)
    curvatures.push(angle * curvatureSign);
  }

  // Add tangents and curvature to road points
  for (let i = 0; i < points.length; i++) {
    points[i].tangent = tangents[i];
    points[i].curvature = curvatures[i];
  }

  return {
    points,
    intersection,
    // Helper function to get point at specific distance along path
    getPointAtDistance: (distance) => {
      // Calculate total path length
      let totalLength = 0;
      const pathLengths = [];

      for (let i = 0; i < points.length; i++) {
        const nextIdx = (i + 1) % points.length;
        const segmentLength = new THREE.Vector3(
          points[nextIdx].x - points[i].x,
          points[nextIdx].y - points[i].y,
          points[nextIdx].z - points[i].z
        ).length();

        pathLengths.push(segmentLength);
        totalLength += segmentLength;
      }

      // Normalize distance to path length
      const normalizedDistance = distance % totalLength;

      // Find segment that contains this distance
      let currentLength = 0;
      for (let i = 0; i < pathLengths.length; i++) {
        if (currentLength + pathLengths[i] >= normalizedDistance) {
          // Found segment, calculate interpolation factor
          const segmentDistance = normalizedDistance - currentLength;
          const segmentFactor = segmentDistance / pathLengths[i];

          // Get segment points
          const p1 = points[i];
          const p2 = points[(i + 1) % points.length];

          // Interpolate between points
          return {
            x: p1.x + (p2.x - p1.x) * segmentFactor,
            y: p1.y + (p2.y - p1.y) * segmentFactor,
            z: p1.z + (p2.z - p1.z) * segmentFactor,
            tangent: {
              x: p1.tangent.x + (p2.tangent.x - p1.tangent.x) * segmentFactor,
              y: p1.tangent.y + (p2.tangent.y - p1.tangent.y) * segmentFactor,
              z: p1.tangent.z + (p2.tangent.z - p1.tangent.z) * segmentFactor
            },
            normal: {
              x: p1.normal.x + (p2.normal.x - p1.normal.x) * segmentFactor,
              y: p1.normal.y + (p2.normal.y - p1.normal.y) * segmentFactor,
              z: p1.normal.z + (p2.normal.z - p1.normal.z) * segmentFactor
            },
            curvature: p1.curvature + (p2.curvature - p1.curvature) * segmentFactor
          };
        }
        currentLength += pathLengths[i];
      }

      // Fallback
      return points[0];
    }
  };
};
