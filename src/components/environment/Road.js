// components/environment/Road.js
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

const Road = ({ path, terrain }) => {
  // Create the road mesh following the terrain
  const roadMesh = useMemo(() => {
    if (!path || !terrain) return null;

    // Road parameters
    const roadWidth = 3.5;
    const roadSegments = path.points.length;

    // Create road geometry
    const points = [];
    const leftEdges = [];
    const rightEdges = [];

    // Generate road vertices following terrain
    for (let i = 0; i < path.points.length; i++) {
      const point = path.points[i];
      const nextPoint = path.points[(i + 1) % path.points.length];

      // Calculate direction vector
      const direction = new THREE.Vector2(
        nextPoint.x - point.x,
        nextPoint.z - point.z
      ).normalize();

      // Calculate perpendicular vector
      const perpendicular = new THREE.Vector2(-direction.y, direction.x);

      // Determine if this point is near the intersection
      const isNearIntersection = Math.abs(point.x) < 8 && Math.abs(point.z) < 8;

      // For points near intersection, use a flat height (intersection height)
      let leftY, rightY;

      if (isNearIntersection) {
        // Use intersection height for flat intersection
        leftY = path.intersection.y + 0.05;
        rightY = path.intersection.y + 0.05;
      } else {
        // Use terrain height for normal road
        leftY = terrain.getHeightAt(point.x + perpendicular.x * roadWidth, point.z + perpendicular.y * roadWidth) + 0.1;
        rightY = terrain.getHeightAt(point.x - perpendicular.x * roadWidth, point.z - perpendicular.y * roadWidth) + 0.1;
      }

      // Create road edges
      const leftEdge = {
        x: point.x + perpendicular.x * roadWidth,
        y: leftY,
        z: point.z + perpendicular.y * roadWidth
      };

      const rightEdge = {
        x: point.x - perpendicular.x * roadWidth,
        y: rightY,
        z: point.z - perpendicular.y * roadWidth
      };

      leftEdges.push(leftEdge);
      rightEdges.push(rightEdge);
    }

    // Create geometry using triangles
    const vertices = [];
    const indices = [];
    const uvs = [];
    const normals = [];

    // Add vertices
    for (let i = 0; i < leftEdges.length; i++) {
      // Add vertices for both edges
      vertices.push(leftEdges[i].x, leftEdges[i].y, leftEdges[i].z);
      vertices.push(rightEdges[i].x, rightEdges[i].y, rightEdges[i].z);

      // Add normal pointing upward to ensure proper lighting
      normals.push(0, 1, 0);
      normals.push(0, 1, 0);

      // Calculate UV coordinates for road texture
      const segmentPercent = i / leftEdges.length;
      uvs.push(0, segmentPercent * 10); // Left edge
      uvs.push(1, segmentPercent * 10); // Right edge
    }

    // Create triangles from vertices
    for (let i = 0; i < leftEdges.length - 1; i++) {
      const v1 = i * 2;
      const v2 = v1 + 1;
      const v3 = v1 + 2;
      const v4 = v1 + 3;

      // First triangle
      indices.push(v1, v2, v3);

      // Second triangle
      indices.push(v2, v4, v3);
    }

    // Close the loop by connecting the last and first points
    const lastIdx = (leftEdges.length - 1) * 2;
    indices.push(lastIdx, lastIdx + 1, 0);
    indices.push(lastIdx + 1, 1, 0);

    // Create road geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);

    return geometry;
  }, [path, terrain]);

  // Create road texture with asphalt look
  const roadTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');

    // Fill with dark gray base
    context.fillStyle = '#222222';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Add some noise/texture for asphalt look
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 2 + 0.5;
      const brightness = Math.random() * 20 + 10;

      context.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      context.fillRect(x, y, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 10);

    return texture;
  }, []);

  // Road markings - center line
  const centerLine = useMemo(() => {
    if (!path) return [];

    return path.points.map(p => {
      // Slightly above road to prevent z-fighting
      return [p.x, p.y + 0.05, p.z];
    });
  }, [path]);

  return (
    <>
      {/* Road surface */}
      {roadMesh && (
        <mesh geometry={roadMesh} receiveShadow position={[0, 0.05, 0]}>
          <meshStandardMaterial
            map={roadTexture}
            color="#555555"
            roughness={0.9}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Road center line */}
      <Line
        points={centerLine}
        color="yellow"
        lineWidth={2}
        dashed
        dashSize={2}
        dashOffset={0}
        dashScale={1}
        position={[0, 0.1, 0]} // Slightly raised to prevent z-fighting
      />

      {/* Road edge lines - solid white */}
      {path && path.points.length > 0 && (
        <>
          <Line
            points={path.points.map((p, i) => {
              const nextP = path.points[(i + 1) % path.points.length];
              const dir = new THREE.Vector2(nextP.x - p.x, nextP.z - p.z).normalize();
              const perp = new THREE.Vector2(-dir.y, dir.x);
              return [
                p.x + perp.x * 3.4,
                p.y + 0.1,
                p.z + perp.y * 3.4
              ];
            })}
            color="white"
            lineWidth={2}
            position={[0, 0.1, 0]} // Slightly raised
          />
          <Line
            points={path.points.map((p, i) => {
              const nextP = path.points[(i + 1) % path.points.length];
              const dir = new THREE.Vector2(nextP.x - p.x, nextP.z - p.z).normalize();
              const perp = new THREE.Vector2(-dir.y, dir.x);
              return [
                p.x - perp.x * 3.4,
                p.y + 0.1,
                p.z - perp.y * 3.4
              ];
            })}
            color="white"
            lineWidth={2}
            position={[0, 0.1, 0]} // Slightly raised
          />
        </>
      )}
    </>
  );
};

export default Road;
