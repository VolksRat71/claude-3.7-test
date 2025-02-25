import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './App.css';

const App = () => {
  const mountRef = useRef(null);
  const [timeOfDay, setTimeOfDay] = useState({ hours: 12, minutes: 0 });
  const [timeMode, setTimeMode] = useState('auto');
  const [animationSpeed, setAnimationSpeed] = useState(0.00004);
  const [simulationRunning, setSimulationRunning] = useState(true);
  const [overrideTime, setOverrideTime] = useState(false);
  const [overrideTimeValue, setOverrideTimeValue] = useState(null);

  // Refs to store scene objects and resources for proper cleanup
  const sceneRef = useRef(null);
  const sunRef = useRef(null);
  const resourcesRef = useRef({
    textures: [],
    geometries: [],
    materials: [],
    lights: [],
    objects: []
  });

  useEffect(() => {
    if (!mountRef.current) return;

    // Resource tracking for proper disposal
    const resources = resourcesRef.current;

    // Get the container dimensions
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);

    // Renderer setup with max efficiency
    const renderer = new THREE.WebGLRenderer({
      antialias: false, // Disable antialiasing for performance
      powerPreference: "high-performance",
      precision: "lowp", // Use low precision for best performance
      preserveDrawingBuffer: false,
      depth: true
    });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap; // Use the simplest shadow map
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1)); // Limit pixel ratio
    mountRef.current.appendChild(renderer.domElement);

    // Custom camera controls
    const cameraControl = {
      target: new THREE.Vector3(0, 0, 0),
      rotateSpeed: 1.0,
      zoomSpeed: 1.2,
      minDistance: 10,
      maxDistance: 50,
      maxPolarAngle: Math.PI / 2 - 0.1,
      isDragging: false,
      isRightDragging: false,
      previousMousePosition: { x: 0, y: 0 },
      spherical: new THREE.Spherical().setFromVector3(
        camera.position.clone().sub(new THREE.Vector3(0, 0, 0))
      )
    };

    // Simplified mouse event handlers
    const handleMouseDown = (event) => {
      if (event.button === 0) {
        cameraControl.isDragging = true;
      } else if (event.button === 2) {
        cameraControl.isRightDragging = true;
      }
      cameraControl.previousMousePosition = { x: event.clientX, y: event.clientY };
      event.preventDefault();
    };

    const handleMouseMove = (event) => {
      if (cameraControl.isDragging) {
        const deltaMove = {
          x: event.clientX - cameraControl.previousMousePosition.x,
          y: event.clientY - cameraControl.previousMousePosition.y
        };

        cameraControl.spherical.theta -= deltaMove.x * 0.01 * cameraControl.rotateSpeed;
        cameraControl.spherical.phi = Math.max(
          0.1,
          Math.min(Math.PI / 2 - 0.1, cameraControl.spherical.phi + deltaMove.y * 0.01 * cameraControl.rotateSpeed)
        );

        const newPosition = new THREE.Vector3().setFromSpherical(cameraControl.spherical);
        camera.position.copy(newPosition.add(cameraControl.target));
        camera.lookAt(cameraControl.target);
      } else if (cameraControl.isRightDragging) {
        const deltaMove = {
          x: event.clientX - cameraControl.previousMousePosition.x,
          y: event.clientY - cameraControl.previousMousePosition.y
        };

        const offset = new THREE.Vector3();
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();

        right.crossVectors(camera.up, camera.getWorldDirection(offset));
        right.normalize().multiplyScalar(-deltaMove.x * 0.05);

        up.copy(camera.up).normalize().multiplyScalar(-deltaMove.y * 0.05);

        cameraControl.target.add(right).add(up);
        camera.position.add(right).add(up);
      }

      cameraControl.previousMousePosition = { x: event.clientX, y: event.clientY };
      event.preventDefault();
    };

    const handleMouseUp = (event) => {
      cameraControl.isDragging = false;
      cameraControl.isRightDragging = false;
      event.preventDefault();
    };

    const handleWheel = (event) => {
      event.preventDefault();
      const delta = Math.sign(event.deltaY);
      cameraControl.spherical.radius += delta * cameraControl.zoomSpeed;
      cameraControl.spherical.radius = Math.max(
        cameraControl.minDistance,
        Math.min(cameraControl.maxDistance, cameraControl.spherical.radius)
      );
      const newPosition = new THREE.Vector3().setFromSpherical(cameraControl.spherical);
      camera.position.copy(newPosition.add(cameraControl.target));
    };

    // Add event listeners
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mouseleave', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel);
    renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    resources.lights.push(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    sunLight.position.set(0, 10, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024; // Reduced from 2048 for better performance
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    scene.add(sunLight);
    sunRef.current = sunLight;
    resources.lights.push(sunLight);

    // Cache textures for reuse
    const textureCache = {
      ground: null,
      sidewalk: null,
      roadH: null,
      roadV: null,
      building: {}
    };

    // Create ground texture with lower resolution
    const createGroundTexture = () => {
      if (textureCache.ground) return textureCache.ground;

      const canvas = document.createElement('canvas');
      canvas.width = 256; // Reduced from 512 to 256
      canvas.height = 256;
      const context = canvas.getContext('2d');

      context.fillStyle = '#4D8A3D';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Greatly simplified noise pattern
      for (let i = 0; i < 200; i++) { // Reduced from 500 to 200
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 2;
        const colorVariation = Math.floor(Math.random() * 20);

        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = `rgb(${77 + colorVariation}, ${138 + colorVariation}, ${61 + colorVariation})`;
        context.fill();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(7, 7); // Adjusted for smaller ground size

      // Generate mipmaps for better performance at distance
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;

      resources.textures.push(texture);
      textureCache.ground = texture;

      return texture;
    };

    // Ground - smaller city size for better performance
    const groundSize = 35; // Reduced from 50 to 35
    const groundTexture = createGroundTexture();
    const groundMaterial = new THREE.MeshStandardMaterial({
      map: groundTexture,
      roughness: 0.8
    });
    resources.materials.push(groundMaterial);

    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    resources.geometries.push(groundGeometry);

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    resources.objects.push(ground);

    // Create building textures with minimal detail and efficient updates
    const createBuildingTexture = (color, numFloors, numWindows, key) => {
      const cacheKey = `${color}-${numFloors}-${numWindows}`;
      if (textureCache.building[cacheKey]) return textureCache.building[cacheKey];

      // Smaller texture dimensions
      const canvas = document.createElement('canvas');
      canvas.width = 128; // Much smaller texture (128x256 instead of 256x512)
      canvas.height = 256;
      const context = canvas.getContext('2d');

      // Base building color
      context.fillStyle = color;
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate max windows - limit to reasonable numbers to reduce objects
      const maxWindows = Math.min(numWindows, 5); // Cap at 5 windows per floor
      const maxFloors = Math.min(numFloors, 8);   // Cap at 8 floors

      const windowWidth = canvas.width / (maxWindows + 1);
      const windowHeight = canvas.height / (maxFloors + 1);

      // Precompute window colors
      const dayColor = '#557788';
      const nightColor = '#112233';
      const nightLitColor = '#FFFFFF';

      // Create two pre-rendered window patterns - one for day, one for night
      const dayPattern = document.createElement('canvas');
      const nightPattern = document.createElement('canvas');
      dayPattern.width = canvas.width;
      dayPattern.height = canvas.height;
      nightPattern.width = canvas.width;
      nightPattern.height = canvas.height;

      const dayCtx = dayPattern.getContext('2d');
      const nightCtx = nightPattern.getContext('2d');

      // Fill base color on both patterns
      dayCtx.fillStyle = color;
      dayCtx.fillRect(0, 0, canvas.width, canvas.height);
      nightCtx.fillStyle = color;
      nightCtx.fillRect(0, 0, canvas.width, canvas.height);

      // Generate window pattern once
      const windows = [];

      for (let floor = 0; floor < maxFloors; floor++) {
        for (let window = 0; window < maxWindows; window++) {
          const x = (window + 1) * (canvas.width / (maxWindows + 1)) - windowWidth / 2;
          const y = (floor + 1) * (canvas.height / (maxFloors + 1)) - windowHeight / 2;

          // Window frame - both day and night
          dayCtx.fillStyle = '#222222';
          dayCtx.fillRect(x, y, windowWidth, windowHeight);
          nightCtx.fillStyle = '#222222';
          nightCtx.fillRect(x, y, windowWidth, windowHeight);

          // Determine if window will be lit at night (random but fixed)
          const willBeLit = Math.random() > 0.3;

          // Day window
          dayCtx.fillStyle = dayColor;
          dayCtx.fillRect(x + 2, y + 2, windowWidth - 4, windowHeight - 4);

          // Night window
          nightCtx.fillStyle = willBeLit ? nightLitColor : nightColor;
          nightCtx.fillRect(x + 2, y + 2, windowWidth - 4, windowHeight - 4);

          // Store window data
          windows.push({
            willBeLit
          });
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      resources.textures.push(texture);
      textureCache.building[cacheKey] = texture;

      // Super efficient window update - just swap between pre-rendered patterns
      let lastIsNight = null;

      texture.updateWindows = (sunHeight) => {
        const isNight = sunHeight < 0.2;

        // Only update if day/night state changed
        if (isNight !== lastIsNight) {
          lastIsNight = isNight;

          // Copy the appropriate pre-rendered pattern
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(isNight ? nightPattern : dayPattern, 0, 0);

          texture.needsUpdate = true;
        }
      };

      return texture;
    };

    // OPTIMIZED: Create a road texture efficiently
    const createRoadTexture = (horizontal = true) => {
      if (horizontal && textureCache.roadH) return textureCache.roadH;
      if (!horizontal && textureCache.roadV) return textureCache.roadV;

      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext('2d');

      // Asphalt base
      context.fillStyle = '#333333';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Lane divider (dashed yellow line)
      context.strokeStyle = '#FFCC00';
      context.lineWidth = 4;
      context.setLineDash([20, 10]);

      if (horizontal) {
        context.beginPath();
        context.moveTo(0, canvas.height / 2);
        context.lineTo(canvas.width, canvas.height / 2);
        context.stroke();

        // Edge white lines
        context.strokeStyle = '#FFFFFF';
        context.setLineDash([]);
        context.lineWidth = 2;

        context.beginPath();
        context.moveTo(0, 10);
        context.lineTo(canvas.width, 10);
        context.moveTo(0, canvas.height - 10);
        context.lineTo(canvas.width, canvas.height - 10);
        context.stroke();
      } else {
        context.beginPath();
        context.moveTo(canvas.width / 2, 0);
        context.lineTo(canvas.width / 2, canvas.height);
        context.stroke();

        // Edge white lines
        context.strokeStyle = '#FFFFFF';
        context.setLineDash([]);
        context.lineWidth = 2;

        context.beginPath();
        context.moveTo(10, 0);
        context.lineTo(10, canvas.height);
        context.moveTo(canvas.width - 10, 0);
        context.lineTo(canvas.width - 10, canvas.height);
        context.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      resources.textures.push(texture);

      if (horizontal) {
        textureCache.roadH = texture;
      } else {
        textureCache.roadV = texture;
      }

      return texture;
    };

    // OPTIMIZED: Create sidewalk texture once
    const createSidewalkTexture = () => {
      if (textureCache.sidewalk) return textureCache.sidewalk;

      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext('2d');

      // Base color
      context.fillStyle = '#AAAAAA';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Grid pattern
      context.strokeStyle = '#999999';
      context.lineWidth = 1;

      const gridSize = 32;
      for (let x = 0; x <= canvas.width; x += gridSize) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.stroke();
      }

      for (let y = 0; y <= canvas.height; y += gridSize) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
        context.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);

      resources.textures.push(texture);
      textureCache.sidewalk = texture;

      return texture;
    };

    // Road system with merged geometries for better performance
    const createRoadSystem = () => {
      const horizontalRoadTexture = createRoadTexture(true);
      const verticalRoadTexture = createRoadTexture(false);
      const sidewalkTexture = createSidewalkTexture();

      const horizontalRoadMaterial = new THREE.MeshStandardMaterial({
        map: horizontalRoadTexture,
        roughness: 0.6
      });
      resources.materials.push(horizontalRoadMaterial);

      const verticalRoadMaterial = new THREE.MeshStandardMaterial({
        map: verticalRoadTexture,
        roughness: 0.6
      });
      resources.materials.push(verticalRoadMaterial);

      const sidewalkMaterial = new THREE.MeshStandardMaterial({
        map: sidewalkTexture,
        roughness: 0.8
      });
      resources.materials.push(sidewalkMaterial);

      // Create geometries to reuse
      const hRoadGeometry = new THREE.PlaneGeometry(groundSize, 4);
      const vRoadGeometry = new THREE.PlaneGeometry(4, groundSize);
      const hSidewalkGeometry = new THREE.PlaneGeometry(groundSize, 1);
      const vSidewalkGeometry = new THREE.PlaneGeometry(1, groundSize);

      resources.geometries.push(hRoadGeometry, vRoadGeometry, hSidewalkGeometry, vSidewalkGeometry);

      // Horizontal roads - adjusted for smaller city
      for (let z = -12; z <= 12; z += 8) {
        const road = new THREE.Mesh(hRoadGeometry, horizontalRoadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.set(0, 0.01, z);
        road.receiveShadow = true;
        scene.add(road);
        resources.objects.push(road);

        // Sidewalks along horizontal roads
        const topSidewalk = new THREE.Mesh(hSidewalkGeometry, sidewalkMaterial);
        topSidewalk.rotation.x = -Math.PI / 2;
        topSidewalk.position.set(0, 0.02, z - 2.5);
        topSidewalk.receiveShadow = true;
        scene.add(topSidewalk);
        resources.objects.push(topSidewalk);

        const bottomSidewalk = new THREE.Mesh(hSidewalkGeometry, sidewalkMaterial);
        bottomSidewalk.rotation.x = -Math.PI / 2;
        bottomSidewalk.position.set(0, 0.02, z + 2.5);
        bottomSidewalk.receiveShadow = true;
        scene.add(bottomSidewalk);
        resources.objects.push(bottomSidewalk);
      }

      // Vertical roads - adjusted for smaller city
      for (let x = -12; x <= 12; x += 8) {
        const road = new THREE.Mesh(vRoadGeometry, verticalRoadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.set(x, 0.01, 0);
        road.receiveShadow = true;
        scene.add(road);
        resources.objects.push(road);

        // Sidewalks along vertical roads
        const leftSidewalk = new THREE.Mesh(vSidewalkGeometry, sidewalkMaterial);
        leftSidewalk.rotation.x = -Math.PI / 2;
        leftSidewalk.position.set(x - 2.5, 0.02, 0);
        leftSidewalk.receiveShadow = true;
        scene.add(leftSidewalk);
        resources.objects.push(leftSidewalk);

        const rightSidewalk = new THREE.Mesh(vSidewalkGeometry, sidewalkMaterial);
        rightSidewalk.rotation.x = -Math.PI / 2;
        rightSidewalk.position.set(x + 2.5, 0.02, 0);
        rightSidewalk.receiveShadow = true;
        scene.add(rightSidewalk);
        resources.objects.push(rightSidewalk);
      }
    };

    createRoadSystem();

    // Buildings with shared materials and geometries
    const buildingColors = [
      { color: '#8899AA', hex: 0x8899AA },
      { color: '#AA8866', hex: 0xAA8866 },
      { color: '#99AACC', hex: 0x99AACC },
      { color: '#DDCCAA', hex: 0xDDCCAA },
      { color: '#CCDDEE', hex: 0xCCDDEE }
    ];

    // Store textures for updates
    const buildingTextures = [];

    // OPTIMIZED: Create buildings with fewer materials and simpler geometries
    const createBuilding = (x, z, width, height, depth, colorInfo) => {
      const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
      resources.geometries.push(buildingGeometry);

      const numFloors = Math.floor(height / 3);
      const numWindows = Math.floor(width / 1.5);

      // Create and reuse textures
      const frontTexture = createBuildingTexture(colorInfo.color, numFloors, numWindows, 'front');
      const sideTexture = createBuildingTexture(colorInfo.color, numFloors, Math.floor(depth / 1.5), 'side');

      buildingTextures.push(frontTexture, sideTexture);

      // Create materials
      const sideMaterial = new THREE.MeshStandardMaterial({ map: sideTexture, roughness: 0.7 });
      const topMaterial = new THREE.MeshStandardMaterial({ color: colorInfo.hex, roughness: 0.7 });
      const frontMaterial = new THREE.MeshStandardMaterial({ map: frontTexture, roughness: 0.7 });

      resources.materials.push(sideMaterial, topMaterial, frontMaterial);

      const materials = [
        sideMaterial,  // right
        sideMaterial,  // left
        topMaterial,   // top
        topMaterial,   // bottom
        frontMaterial, // front
        frontMaterial  // back
      ];

      const building = new THREE.Mesh(buildingGeometry, materials);
      building.position.set(x, height / 2, z);
      building.castShadow = true;
      building.receiveShadow = true;
      scene.add(building);
      resources.objects.push(building);
    };

    // Create downtown buildings - adjusted for smaller size but maintain density
    // Use a grid from -12 to 12 instead of -16 to 16
    for (let x = -12; x <= 12; x += 8) {
      for (let z = -12; z <= 12; z += 8) {
        if (x !== 0 && z !== 0) {  // Skip the center intersection
          // Place buildings at the four corners of each intersection
          const offsets = [
            { dx: -3, dz: -3 },  // Northwest corner
            { dx: -3, dz: 3 },   // Southwest corner
            { dx: 3, dz: -3 },   // Northeast corner
            { dx: 3, dz: 3 }     // Southeast corner
          ];

          for (const offset of offsets) {
            const bx = x + offset.dx;
            const bz = z + offset.dz;

            // Random building parameters
            const colorInfo = buildingColors[Math.floor(Math.random() * buildingColors.length)];
            const height = 5 + Math.random() * 15;
            const width = 2 + Math.random() * 1;
            const depth = 2 + Math.random() * 1;

            createBuilding(bx, bz, width, height, depth, colorInfo);
          }
        }
      }
    }

    // OPTIMIZED: Traffic light system with fewer objects and shared materials
    const trafficLights = [];

    // Reusable geometries and materials for traffic lights
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
    const housingGeometry = new THREE.BoxGeometry(0.5, 1.2, 0.3);
    const lightGeometry = new THREE.CircleGeometry(0.1, 16);

    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const housingMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const redLightMaterial = new THREE.MeshStandardMaterial({ color: 0x660000, emissive: 0x000000 });
    const yellowLightMaterial = new THREE.MeshStandardMaterial({ color: 0x666600, emissive: 0x000000 });
    const greenLightMaterial = new THREE.MeshStandardMaterial({ color: 0x006600, emissive: 0x000000 });

    resources.geometries.push(poleGeometry, housingGeometry, lightGeometry);
    resources.materials.push(poleMaterial, housingMaterial, redLightMaterial, yellowLightMaterial, greenLightMaterial);

    function createTrafficLight(x, z, rotation) {
      const trafficLightGroup = new THREE.Group();
      resources.objects.push(trafficLightGroup);

      // Pole
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.y = 1.5;
      pole.castShadow = true;
      trafficLightGroup.add(pole);

      // Light housing
      const housing = new THREE.Mesh(housingGeometry, housingMaterial);
      housing.position.set(0, 3, 0);
      housing.castShadow = true;
      trafficLightGroup.add(housing);

      // Lights
      const redLight = new THREE.Mesh(lightGeometry, redLightMaterial.clone());
      redLight.position.set(0, 3.4, 0.16);
      redLight.rotation.x = -Math.PI / 2;
      trafficLightGroup.add(redLight);

      const yellowLight = new THREE.Mesh(lightGeometry, yellowLightMaterial.clone());
      yellowLight.position.set(0, 3, 0.16);
      yellowLight.rotation.x = -Math.PI / 2;
      trafficLightGroup.add(yellowLight);

      const greenLight = new THREE.Mesh(lightGeometry, greenLightMaterial.clone());
      greenLight.position.set(0, 2.6, 0.16);
      greenLight.rotation.x = -Math.PI / 2;
      trafficLightGroup.add(greenLight);

      // Position and rotate
      trafficLightGroup.position.set(x, 0, z);
      trafficLightGroup.rotation.y = rotation;
      scene.add(trafficLightGroup);

      return {
        group: trafficLightGroup,
        lights: {
          red: { mesh: redLight, material: redLight.material },
          yellow: { mesh: yellowLight, material: yellowLight.material },
          green: { mesh: greenLight, material: greenLight.material }
        },
        state: 'red',
        timeToChange: Math.random() * 5,
        direction: Math.abs(rotation) < 0.1 || Math.abs(rotation - Math.PI) < 0.1 ? 'northsouth' : 'eastwest'
      };
    }

    // Create traffic lights at each intersection - adjusted for smaller city
    for (let x = -12; x <= 12; x += 8) {
      for (let z = -12; z <= 12; z += 8) {
        if (x !== 0 || z !== 0) { // Skip center intersection
          // North facing traffic light
          trafficLights.push(createTrafficLight(x - 1.5, z - 1.5, 0));

          // East facing traffic light
          trafficLights.push(createTrafficLight(x - 1.5, z + 1.5, Math.PI / 2));

          // South facing traffic light
          trafficLights.push(createTrafficLight(x + 1.5, z + 1.5, Math.PI));

          // West facing traffic light
          trafficLights.push(createTrafficLight(x + 1.5, z - 1.5, -Math.PI / 2));
        }
      }
    }

    // Cars with shared geometries and improved behavior
    const cars = [];
    const carColors = [0xFF0000, 0x0077FF, 0x00AA00, 0xDDAA22, 0xAA44CC, 0xFF8800, 0xFFFFFF, 0x111111];

    // Reusable car geometries and materials
    const carBodyGeometry = new THREE.BoxGeometry(0.8, 0.3, 1.6);
    const cabinGeometry = new THREE.BoxGeometry(0.7, 0.25, 0.8);
    const wheelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
    const headlightGeometry = new THREE.SphereGeometry(0.05, 8, 8);

    resources.geometries.push(carBodyGeometry, cabinGeometry, wheelGeometry, headlightGeometry);

    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const headlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: 0xFFFF77,
      emissiveIntensity: 0.5
    });
    const taillightMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF0000,
      emissive: 0xFF0000,
      emissiveIntensity: 0.5
    });

    resources.materials.push(wheelMaterial, cabinMaterial, headlightMaterial, taillightMaterial);

    const createCar = (x, z, colorHex, direction) => {
      const carGroup = new THREE.Group();
      resources.objects.push(carGroup);

      // Car body with unique color
      const carBodyMaterial = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.5,
        metalness: 0.5
      });
      resources.materials.push(carBodyMaterial);

      const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial);
      carBody.castShadow = true;
      carBody.receiveShadow = true;
      carGroup.add(carBody);

      // Car cabin
      const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
      cabin.position.set(0, 0.28, 0.1);
      cabin.castShadow = true;
      cabin.receiveShadow = true;
      carGroup.add(cabin);

      // Wheels
      const wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheelFL.position.set(-0.4, -0.1, 0.5);
      wheelFL.rotation.z = Math.PI / 2;
      wheelFL.castShadow = true;
      carGroup.add(wheelFL);

      const wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheelFR.position.set(0.4, -0.1, 0.5);
      wheelFR.rotation.z = Math.PI / 2;
      wheelFR.castShadow = true;
      carGroup.add(wheelFR);

      const wheelRL = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheelRL.position.set(-0.4, -0.1, -0.5);
      wheelRL.rotation.z = Math.PI / 2;
      wheelRL.castShadow = true;
      carGroup.add(wheelRL);

      const wheelRR = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheelRR.position.set(0.4, -0.1, -0.5);
      wheelRR.rotation.z = Math.PI / 2;
      wheelRR.castShadow = true;
      carGroup.add(wheelRR);

      // Headlights and taillights
      const headlightL = new THREE.Mesh(headlightGeometry, headlightMaterial);
      headlightL.position.set(-0.3, 0, 0.8);
      carGroup.add(headlightL);

      const headlightR = new THREE.Mesh(headlightGeometry, headlightMaterial);
      headlightR.position.set(0.3, 0, 0.8);
      carGroup.add(headlightR);

      const taillightL = new THREE.Mesh(headlightGeometry, taillightMaterial);
      taillightL.position.set(-0.3, 0, -0.8);
      carGroup.add(taillightL);

      const taillightR = new THREE.Mesh(headlightGeometry, taillightMaterial);
      taillightR.position.set(0.3, 0, -0.8);
      carGroup.add(taillightR);

      carGroup.position.set(x, 0.3, z);

      // Adjust rotation based on direction
      if (direction === 'north') {
        carGroup.rotation.y = Math.PI;
      } else if (direction === 'east') {
        carGroup.rotation.y = -Math.PI / 2;
      } else if (direction === 'south') {
        carGroup.rotation.y = 0;
      } else if (direction === 'west') {
        carGroup.rotation.y = Math.PI / 2;
      }

      // Fast car speeds but still controllable
      const baseSpeed = 0.15 + Math.random() * 0.05;

      const car = {
        mesh: carGroup,
        direction,
        speed: baseSpeed,
        initialSpeed: baseSpeed,
        lane: direction.includes('outer') ? 1 : -1, // 1 for outer lane, -1 for inner lane
        atRed: false,
        waitTime: 0,
        approachingIntersection: false,
        nearestIntersection: null,
        lastX: x,
        lastZ: z,
        active: true
      };

      cars.push(car);
      scene.add(carGroup);

      return car;
    };

    // Initialize a balanced number of cars for the smaller city
    function initializeCars() {
      // Horizontal roads - adjusted for smaller city
      const horizontalRoads = [-12, 0, 12];
      for (let z of horizontalRoads) {
        const lanesZ = [-1, 1]; // Lane offset from center

        for (let laneIdx = 0; laneIdx < 2; laneIdx++) {
          const lane = lanesZ[laneIdx];
          const direction = lane < 0 ? 'west' : 'east';

          // 1 car per lane - 6 horizontal cars total
          const x = Math.random() * 10 - 5;
          const zOffset = z + lane;
          const color = carColors[Math.floor(Math.random() * carColors.length)];
          createCar(x, zOffset, color, direction);
        }
      }

      // Vertical roads - adjusted for smaller city
      const verticalRoads = [-12, 0, 12];
      for (let x of verticalRoads) {
        const lanesX = [-1, 1]; // Lane offset from center

        for (let laneIdx = 0; laneIdx < 2; laneIdx++) {
          const lane = lanesX[laneIdx];
          const direction = lane < 0 ? 'north' : 'south';

          // 1 car per lane - 6 vertical cars total
          const z = Math.random() * 10 - 5;
          const xOffset = x + lane;
          const color = carColors[Math.floor(Math.random() * carColors.length)];
          createCar(xOffset, z, color, direction);
        }
      }
    }

    initializeCars();

    // OPTIMIZED: Traffic light update - use spatial partitioning for efficiency
    const intersectionMap = {};

    // Group lights by intersection
    trafficLights.forEach(light => {
      const gridX = Math.round(light.group.position.x / 8) * 8;
      const gridZ = Math.round(light.group.position.z / 8) * 8;
      const key = `${gridX},${gridZ}`;

      if (!intersectionMap[key]) {
        intersectionMap[key] = {
          lights: [],
          cycleTime: 10.0,
          currentTime: Math.random() * 10.0,
          northSouthGreen: true,
          x: gridX,
          z: gridZ
        };
      }

      intersectionMap[key].lights.push(light);
    });

    // Memoized traffic light detection - significantly faster
    const trafficLightCache = {};
    const trafficLightCacheTimeout = 1000; // Cache results for 1 second
    let lastTrafficLightCheck = 0;

    function getNearestTrafficLight(car) {
      const carPosition = car.mesh.position;
      const carDirection = car.direction;

      // Create a cache key based on approximate position and direction
      // Round position to nearest 1 unit for effective caching
      const cacheX = Math.round(carPosition.x);
      const cacheZ = Math.round(carPosition.z);
      const cacheKey = `${cacheX},${cacheZ},${carDirection}`;

      // Check if we have a recent cache entry
      const currentTime = Date.now();
      if (
        trafficLightCache[cacheKey] &&
        currentTime - trafficLightCache[cacheKey].timestamp < trafficLightCacheTimeout
      ) {
        return trafficLightCache[cacheKey].result;
      }

      // If not in cache, check less frequently
      if (currentTime - lastTrafficLightCheck < 100) { // Only check every 100ms
        return {
          light: null,
          distance: Infinity,
          approachingIntersection: false,
          nearestIntersection: null
        };
      }

      lastTrafficLightCheck = currentTime;

      // Perform actual detection logic
      let nearestLight = null;
      let minDistance = Infinity;
      let approachingIntersection = false;
      let nearestIntersection = null;

      // Get the grid position of the car (using smaller grid for new city size)
      const gridX = Math.round(carPosition.x / 8) * 8;
      const gridZ = Math.round(carPosition.z / 8) * 8;

      // Determine if car is approaching an intersection
      const distToIntersectionX = Math.abs(carPosition.x - gridX);
      const distToIntersectionZ = Math.abs(carPosition.z - gridZ);

      // Different thresholds based on direction
      if (carDirection === 'east' || carDirection === 'west') {
        if (distToIntersectionX < 4) { // Reduced threshold for smaller city
          approachingIntersection = true;
          nearestIntersection = { x: gridX, z: gridZ };
        }
      } else if (carDirection === 'north' || carDirection === 'south') {
        if (distToIntersectionZ < 4) { // Reduced threshold for smaller city
          approachingIntersection = true;
          nearestIntersection = { x: gridX, z: gridZ };
        }
      }

      if (approachingIntersection) {
        // Use the intersection map for quick lookup
        const key = `${nearestIntersection.x},${nearestIntersection.z}`;
        const intersection = intersectionMap[key];

        if (intersection) {
          // Find most relevant light based on direction (simplified logic)
          const relevantDirection = (carDirection === 'east' || carDirection === 'west') ? 'eastwest' : 'northsouth';

          // Find first matching light rather than checking all of them
          for (const light of intersection.lights) {
            if (light.direction === relevantDirection) {
              // Calculate simple euclidean distance
              const dx = light.group.position.x - carPosition.x;
              const dz = light.group.position.z - carPosition.z;
              const distance = Math.sqrt(dx * dx + dz * dz);

              // Take the first matching light
              minDistance = distance;
              nearestLight = light;
              break; // Only need one light
            }
          }
        }
      }

      const result = {
        light: nearestLight,
        distance: minDistance,
        approachingIntersection,
        nearestIntersection
      };

      // Store in cache
      trafficLightCache[cacheKey] = {
        result,
        timestamp: currentTime
      };

      return result;
    }

    // Improved traffic light cycle control with realistic timing
    function updateTrafficLights(deltaTime) {
      // Update each intersection
      Object.values(intersectionMap).forEach(intersection => {
        // Update cycle time
        intersection.currentTime += deltaTime;
        if (intersection.currentTime >= intersection.cycleTime) {
          intersection.currentTime = 0;
          intersection.northSouthGreen = !intersection.northSouthGreen;
        }

        // Determine light states based on cycle time
        const cyclePercentage = intersection.currentTime / intersection.cycleTime;

        let northSouthState, eastWestState;

        if (intersection.northSouthGreen) {
          // North-South has green
          if (cyclePercentage < 0.75) {
            northSouthState = 'green';
            eastWestState = 'red';
          } else if (cyclePercentage < 0.85) {
            northSouthState = 'yellow';
            eastWestState = 'red';
          } else {
            northSouthState = 'red';
            eastWestState = 'red';
          }
        } else {
          // East-West has green
          if (cyclePercentage < 0.75) {
            northSouthState = 'red';
            eastWestState = 'green';
          } else if (cyclePercentage < 0.85) {
            northSouthState = 'red';
            eastWestState = 'yellow';
          } else {
            northSouthState = 'red';
            eastWestState = 'red';
          }
        }

        // Update light materials
        intersection.lights.forEach(light => {
          // Reset all lights
          light.lights.red.material.emissive.setRGB(0, 0, 0);
          light.lights.yellow.material.emissive.setRGB(0, 0, 0);
          light.lights.green.material.emissive.setRGB(0, 0, 0);

          // Set appropriate light
          const lightState = light.direction === 'northsouth' ? northSouthState : eastWestState;
          light.state = lightState;

          if (lightState === 'red') {
            light.lights.red.material.emissive.setRGB(1, 0, 0);
          } else if (lightState === 'yellow') {
            light.lights.yellow.material.emissive.setRGB(1, 1, 0);
          } else if (lightState === 'green') {
            light.lights.green.material.emissive.setRGB(0, 1, 0);
          }
        });
      });
    }

    // Improved car movement with better traffic light detection
    function updateCars(deltaTime, speedMultiplier) {
      const carSpeedMultiplier = 2.5 * speedMultiplier;

      cars.forEach(car => {
        if (!car.active || !car.mesh) return;

        // Apply animation and car speed multipliers
        const appliedSpeed = car.speed * carSpeedMultiplier;

        // Store previous position for direction detection
        car.lastX = car.mesh.position.x;
        car.lastZ = car.mesh.position.z;

        // Check for traffic lights - throttled to improve performance
        let currentSpeed = appliedSpeed;

        // Only check traffic lights every few frames
        if (Math.random() < 0.2) {
          const { light, distance, approachingIntersection } = getNearestTrafficLight(car);

          // Handle traffic light behavior
          if (approachingIntersection && light) {
            if (light.state === 'red' || light.state === 'yellow') {
              // Slow down for yellow, stop for red
              const slowDownDistance = light.state === 'red' ? 3.0 : 2.0;

              if (distance < slowDownDistance) {
                // Calculate deceleration based on distance
                const deceleration = Math.max(0, (distance / slowDownDistance)) * appliedSpeed;
                currentSpeed = deceleration;

                // Complete stop at red when very close
                if (light.state === 'red' && distance < 1.5) {
                  currentSpeed = 0;
                  car.atRed = true;
                }
              }
            } else if (car.atRed && light.state === 'green') {
              // Start moving again when light turns green
              car.atRed = false;
              currentSpeed = appliedSpeed * 0.7; // Start at 70% speed
            }
          } else if (!car.atRed) {
            // Regular driving speed when not at traffic light
            currentSpeed = appliedSpeed;
          }
        }

        // Move the car based on direction and speed
        if (car.direction === 'east') {
          car.mesh.position.x += currentSpeed * deltaTime;
          if (car.mesh.position.x > 25) car.mesh.position.x = -25;
        }
        else if (car.direction === 'west') {
          car.mesh.position.x -= currentSpeed * deltaTime;
          if (car.mesh.position.x < -25) car.mesh.position.x = 25;
        }
        else if (car.direction === 'north') {
          car.mesh.position.z -= currentSpeed * deltaTime;
          if (car.mesh.position.z < -25) car.mesh.position.z = 25;
        }
        else if (car.direction === 'south') {
          car.mesh.position.z += currentSpeed * deltaTime;
          if (car.mesh.position.z > 25) car.mesh.position.z = -25;
        }
      });
    }

    // Set sun position based on time mode
    function setSunPosition(mode, time = null) {
      if (!sunRef.current) return 0;

      let sunAngle = 0;

      switch(mode) {
        case 'auto':
          sunAngle = time !== null ? time : Date.now() * animationSpeed;
          break;
        case 'midday':
          sunAngle = Math.PI / 2;
          break;
        case 'midnight':
          sunAngle = 3 * Math.PI / 2;
          break;
        case 'dawn':
          sunAngle = 0;
          break;
        case 'dusk':
          sunAngle = Math.PI;
          break;
        default:
          sunAngle = time !== null ? time : Date.now() * animationSpeed;
      }

      // Apply the sun angle
      sunRef.current.position.x = Math.sin(sunAngle) * 15;
      sunRef.current.position.y = Math.abs(Math.cos(sunAngle)) * 15 + 2;
      sunRef.current.position.z = Math.cos(sunAngle) * 15;

      return sunAngle;
    }

    // Optimized animation loop with heavy throttling and framerate management
    let lastTime = Date.now();
    let animationId;
    let timeAccumulator = 0;
    let lastWindowUpdate = 0;
    let lastFrameTime = 0;
    let frameCount = 0;
    let sunAngleOffset = Math.random() * Math.PI * 2; // Random starting time of day
    let targetFPS = 30; // Target 30 FPS for better performance
    let frameInterval = 1000/targetFPS;

    // Create a state object to avoid React state updates in animation loop
    const internalState = {
      hours: 12,
      minutes: 0
    };

    const animate = () => {
      try {
        animationId = requestAnimationFrame(animate);

        // Throttle framerate for better performance
        const now = Date.now();
        const elapsed = now - lastFrameTime;

        if (elapsed < frameInterval) {
          return; // Skip frame to maintain target FPS
        }

        // Calculate actual delta with FPS adjustment
        const actualFPS = 1000 / Math.max(1, elapsed);
        const fpsRatio = Math.min(targetFPS / actualFPS, 2);

        lastFrameTime = now - (elapsed % frameInterval);
        frameCount++;

        setSimulationRunning(true);

        // Calculate delta time with maximum to prevent freezing
        const rawDeltaTime = (now - lastTime) / 1000;
        const deltaTime = Math.min(rawDeltaTime * fpsRatio, 0.1);
        lastTime = now;

        timeAccumulator += deltaTime;

        // Move sun based on time mode
        let sunAngle;
        if (timeMode === 'auto') {
          // For auto time mode, use accumulated time for consistent day/night cycle
          sunAngle = sunAngleOffset + (timeAccumulator * animationSpeed);
          sunAngle = sunAngle % (Math.PI * 2);

          if (overrideTime) {
            sunAngle = overrideTimeValue;
          }
        } else {
          // For fixed time modes
          sunAngle = setSunPosition(timeMode);
        }

        // Update sun position
        if (sunRef.current) {
          sunRef.current.position.x = Math.sin(sunAngle) * 15;
          sunRef.current.position.y = Math.abs(Math.cos(sunAngle)) * 15 + 2;
          sunRef.current.position.z = Math.cos(sunAngle) * 15;
        }

        // Heavy throttling - update traffic lights every 5 frames
        if (frameCount % 5 === 0) {
          updateTrafficLights(deltaTime);
        }

        // Update cars every other frame
        if (frameCount % 2 === 0) {
          updateCars(deltaTime, animationSpeed / 0.00004);
        }

        // Handle essential visual effects only
        if (sunRef.current) {
          const sunHeight = (sunRef.current.position.y - 2) / 15;

          // Update ambient light intensity (key for day/night feel)
          ambientLight.intensity = 0.1 + sunHeight * 0.3;

          // Sun color updates every 5 frames
          if (frameCount % 5 === 0) {
            const sunColor = new THREE.Color();
            if (sunHeight < 0.3) {
              const t = sunHeight / 0.3;
              sunColor.setRGB(1, 0.5 + t * 0.5, 0.3 + t * 0.7);
            } else {
              sunColor.setRGB(1, 1, 1);
            }
            sunRef.current.color = sunColor;
            sunRef.current.intensity = 0.5 + sunHeight * 1.5;
          }

          // Calculate time of day (but only update UI every second to avoid React renders)
          const totalHours = (sunAngle / (Math.PI * 2)) * 24;
          const hours = Math.floor(totalHours) % 24;
          const minutesDecimal = (totalHours - Math.floor(totalHours)) * 60;
          const minutes = Math.round(minutesDecimal / 5) * 5 % 60;

          // Store time in internal state
          internalState.hours = hours;
          internalState.minutes = minutes;

          // Only update React state once per second
          if (now - lastWindowUpdate > 1000) {
            setTimeOfDay({
              hours: internalState.hours,
              minutes: internalState.minutes
            });

            // Update sky color (once per second)
            if (sceneRef.current) {
              const skyColor = new THREE.Color();
              if (sunHeight < 0.2) {
                // Night/dawn/dusk
                const t = sunHeight / 0.2;
                skyColor.setRGB(0.1 + t * 0.2, 0.1 + t * 0.3, 0.3 + t * 0.5);
              } else {
                // Day
                skyColor.setRGB(0.5 + sunHeight * 0.3, 0.7 + sunHeight * 0.3, 0.9 + sunHeight * 0.1);
              }
              sceneRef.current.background = skyColor;
            }

            // Update building windows (once per second)
            buildingTextures.forEach(texture => {
              if (texture.updateWindows) {
                texture.updateWindows(sunHeight);
              }
            });

            lastWindowUpdate = now;
          }
        }

        // Render the scene
        renderer.render(scene, camera);

        // Memory management - periodically hint garbage collection
        if (frameCount % 600 === 0) { // Every ~20 seconds at 30fps
          if (window.gc) window.gc();
        }
      } catch (error) {
        console.error("Error in animation loop:", error);
        // Cancel animation on error to prevent resource consumption
        cancelAnimationFrame(animationId);
        setSimulationRunning(false);
      }
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current) return;

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // IMPROVED: Comprehensive cleanup function
    return () => {
      // Remove event listeners
      window.removeEventListener('resize', handleResize);

      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mouseleave', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('contextmenu', e => e.preventDefault());

      // Cancel animation frame
      if (animationId) {
        cancelAnimationFrame(animationId);
      }

      // Remove renderer from DOM
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }

      // Dispose all Three.js resources
      console.log("Cleaning up resources...");

      // 1. Dispose all geometries
      resources.geometries.forEach(geometry => {
        if (geometry && geometry.dispose) {
          geometry.dispose();
        }
      });

      // 2. Dispose all materials
      resources.materials.forEach(material => {
        if (material && material.dispose) {
          material.dispose();
        }
      });

      // 3. Dispose all textures
      resources.textures.forEach(texture => {
        if (texture && texture.dispose) {
          texture.dispose();
        }
      });

      // 4. Remove all objects from scene
      resources.objects.forEach(obj => {
        if (obj && obj.parent) {
          obj.parent.remove(obj);
        }
      });

      // 5. Dispose any other resources
      if (renderer && renderer.dispose) {
        renderer.dispose();
      }

      if (renderer && renderer.renderLists) {
        renderer.renderLists.dispose();
      }

      if (sceneRef.current) {
        // Clear the scene
        while(sceneRef.current.children.length > 0) {
          sceneRef.current.remove(sceneRef.current.children[0]);
        }
      }

      // Clear resource references
      resources.geometries = [];
      resources.materials = [];
      resources.textures = [];
      resources.lights = [];
      resources.objects = [];

      // Force garbage collection hint (not guaranteed to run)
      if (window.gc) {
        window.gc();
      }

      console.log("Cleanup complete");
    };
  }, [timeMode, animationSpeed, overrideTime, overrideTimeValue]);

  // Handle time mode change
  const handleTimeModeChange = (event) => {
    const newMode = event.target.value;
    setTimeMode(newMode);

    // Set override time value based on selection
    let timeValue = null;
    switch(newMode) {
      case 'midday':
        timeValue = Math.PI / 2;
        break;
      case 'midnight':
        timeValue = 3 * Math.PI / 2;
        break;
      case 'dawn':
        timeValue = 0;
        break;
      case 'dusk':
        timeValue = Math.PI;
        break;
      default:
        // Auto mode
        setOverrideTime(false);
        return;
    }

    setOverrideTime(true);
    setOverrideTimeValue(timeValue);
  };

  // Handle animation speed change
  const handleSpeedChange = (event) => {
    const newSpeed = parseFloat(event.target.value);
    setAnimationSpeed(newSpeed);
  };

  // Function to reset simulation
  const resetSimulation = () => {
    // Force a component remount
    window.location.reload();
  };

  return (
    <div className="app-container">
      <div className="control-panel">
        <div className="time-display">
          Time: {timeOfDay.hours.toString().padStart(2, '0')}:{timeOfDay.minutes.toString().padStart(2, '0')}
          {!simulationRunning && (
            <span className="simulation-paused"> (PAUSED)</span>
          )}
        </div>

        <div className="controls">
          <div className="control-group">
            <label htmlFor="time-select">Time: </label>
            <select
              id="time-select"
              value={timeMode}
              onChange={handleTimeModeChange}
              className="time-select"
            >
              <option value="auto">Auto</option>
              <option value="midday">Midday</option>
              <option value="midnight">Midnight</option>
              <option value="dawn">Dawn</option>
              <option value="dusk">Dusk</option>
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="speed-slider">Speed: </label>
            <input
              id="speed-slider"
              type="range"
              min="0.00001"
              max="0.0001"
              step="0.00001"
              value={animationSpeed}
              onChange={handleSpeedChange}
              className="speed-slider"
            />
          </div>

          {!simulationRunning && (
            <button onClick={resetSimulation} className="reset-button">
              Reset Simulation
            </button>
          )}
        </div>
      </div>

      <div className="scene-container">
        <div ref={mountRef} className="three-container"></div>
      </div>
    </div>
  );
};

export default App;
