// components/environment/Road.js
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

const Road = ({ path }) => {
  const roadGeometry = useMemo(() => {
    const shapes = [];

    // Create road mesh following the path
    const roadShape = new THREE.Shape();
    const roadWidth = 2;

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

      // Create road edges
      const leftEdge = {
        x: point.x + perpendicular.x * roadWidth,
        z: point.z + perpendicular.y * roadWidth
      };

      const rightEdge = {
        x: point.x - perpendicular.x * roadWidth,
        z: point.z - perpendicular.y * roadWidth
      };

      if (i === 0) {
        roadShape.moveTo(leftEdge.x, leftEdge.z);
      } else {
        roadShape.lineTo(leftEdge.x, leftEdge.z);
      }

      // Additional shapes for intersections, etc.
      if (point.isIntersection) {
        const intersectionShape = new THREE.Shape();
        intersectionShape.moveTo(point.x - roadWidth * 2, point.z - roadWidth * 2);
        intersectionShape.lineTo(point.x + roadWidth * 2, point.z - roadWidth * 2);
        intersectionShape.lineTo(point.x + roadWidth * 2, point.z + roadWidth * 2);
        intersectionShape.lineTo(point.x - roadWidth * 2, point.z + roadWidth * 2);
        shapes.push(intersectionShape);
      }
    }

    // Complete the road shape
    for (let i = path.points.length - 1; i >= 0; i--) {
      const point = path.points[i];
      const prevPoint = path.points[(i - 1 + path.points.length) % path.points.length];

      const direction = new THREE.Vector2(
        prevPoint.x - point.x,
        prevPoint.z - point.z
      ).normalize();

      const perpendicular = new THREE.Vector2(-direction.y, direction.x);

      const rightEdge = {
        x: point.x - perpendicular.x * roadWidth,
        z: point.z - perpendicular.y * roadWidth
      };

      roadShape.lineTo(rightEdge.x, rightEdge.z);
    }

    shapes.unshift(roadShape);
    return shapes;
  }, [path]);

  return (
    <>
      {roadGeometry.map((shape, index) => (
        <mesh key={`road-${index}`} position={[0, 0.05, 0]} receiveShadow>
          <shapeGeometry args={[shape]} />
          <meshStandardMaterial color="#333" roughness={0.9} />
        </mesh>
      ))}

      {/* Road markings */}
      <Line
        points={path.points.map(p => [p.x, p.y + 0.06, p.z])}
        color="yellow"
        lineWidth={1}
        dashed
        dashSize={0.5}
        dashScale={1}
        dashOffset={0}
      />
    </>
  );
};

export default Road;
