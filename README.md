# 3D City Simulation

A real-time 3D city simulation built using React and Three.js, showcasing advanced rendering optimizations, dynamic day/night cycles, realistic traffic simulation, and interactive camera controls. This project was built in roughly one hour, demonstrating rapid prototyping with high-performance and clean code practices.

## Features

- **High-Performance Rendering**
  - Configured WebGLRenderer for maximum efficiency (antialiasing disabled, low precision, limited pixel ratio).
  - Throttled animation loop targeting 30 FPS for smooth performance.

- **Dynamic Day/Night Cycle**
  - Realistic sun movement calculated using trigonometric functions.
  - Dynamic changes in ambient light, sky color, and building window illumination via pre-rendered textures.

- **Traffic and Vehicle Simulation**
  - Realistic traffic light cycles with grouping and caching for efficient detection.
  - Vehicles with adaptive behavior (acceleration, deceleration, and looping) reacting to traffic signals.

- **Advanced Resource Management**
  - Caching and reuse of textures, geometries, and materials to minimize redundant computations.
  - Comprehensive cleanup of all Three.js resources (geometries, materials, textures, lights, and objects) to prevent memory leaks.

- **Interactive Camera Controls**
  - Custom mouse event handlers for rotation, panning, and zooming, providing an intuitive navigation experience.

- **Modular and Clean Code Structure**
  - Separation of concerns via modular functions for scene setup, resource management, simulation updates, and user controls.
  - Robust error handling within the animation loop and systematic cleanup on component unmount.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v12 or higher recommended)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/VolksRat71/claude-3.7-test
   cd claude-3.7-test
   ```

2. **Install Dependencies**

   Using npm:

   ```bash
   npm install
   ```

   Or using Yarn:

   ```bash
   yarn install
   ```

### Running the Application

Start the development server:

```bash
npm start
```

Or if using Yarn:

```bash
yarn start
```

The app will open in your browser at `http://localhost:3000`, displaying the interactive 3D city simulation.

## Code Structure

- **App.js**
  The main React component that sets up the Three.js scene and handles:
  - Scene, camera, and renderer initialization.
  - Custom camera controls (mouse and wheel event handlers).
  - Creation of dynamic textures (ground, roads, buildings).
  - Simulation of a dynamic day/night cycle (sun position and ambient lighting).
  - Traffic simulation including vehicles and traffic lights.
  - Resource management with caching and cleanup to ensure optimal performance.

- **CSS Styling**
  The `App.css` file contains styling for the control panel and scene container, ensuring a clean layout for both the simulation and user interface.

## Performance Optimizations

- **Renderer Settings:**
  The renderer is initialized with performance in mind:
  ```js
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: "high-performance",
    precision: "lowp",
    preserveDrawingBuffer: false,
    depth: true
  });
  ```
- **Animation Loop:**
  A throttled animation loop using a target frame interval maintains smooth performance while reducing unnecessary frame renders.
- **Resource Management:**
  All textures, geometries, materials, lights, and objects are tracked in a `resources` object and properly disposed of in the cleanup function.

## Dynamic Simulation Details

- **Day/Night Cycle:**
  The sun’s position is updated dynamically based on time, affecting:
  - Ambient light intensity and color.
  - Sky background color.
  - Building window lighting through efficient pre-rendered textures.
- **Traffic System:**
  Vehicles are programmed to respond to traffic lights, with realistic acceleration and deceleration based on proximity to intersections.

## Contribution

Feel free to fork this repository and contribute enhancements, bug fixes, or optimizations. Pull requests are welcome!

## License

This project is open source and available under the [MIT License](LICENSE).

---

Built in roughly one hour, this project demonstrates that with modern frameworks like React and Three.js, you can achieve sophisticated, interactive simulations with thoughtful performance optimizations and clean, modular code.
