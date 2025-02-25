// App.js - Main application entry point
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, OrbitControls, Stats } from '@react-three/drei';
import Scene from './components/Scene';
import './App.css';

function App() {
  return (
    <div className="App">
      <Canvas shadows camera={{ position: [0, 10, 20], fov: 60 }}>
        <Stats />
        <OrbitControls />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;

