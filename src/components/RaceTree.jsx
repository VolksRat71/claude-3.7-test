import React from 'react';

const RaceTree = ({ phase }) => {
  // Tree light states based on phase
  const lightStates = {
    idle: [false, false, false, false],
    staging: [true, false, false, false],
    ready: [true, true, false, false],
    racing: [false, false, false, true], // Green light
    finished: [false, false, false, false]
  };

  const currentLights = lightStates[phase] || [false, false, false, false];

  return (
    <div className="absolute left-[10%] top-[25%] transform -translate-x-1/2 -translate-y-1/2 z-20">
      <div className="w-6 h-32 bg-black rounded flex flex-col items-center justify-around p-1">
        {/* Red lights */}
        <div className={`w-4 h-4 rounded-full ${currentLights[0] ? 'bg-red-600' : 'bg-red-900'}`}></div>
        <div className={`w-4 h-4 rounded-full ${currentLights[1] ? 'bg-red-600' : 'bg-red-900'}`}></div>
        <div className={`w-4 h-4 rounded-full ${currentLights[2] ? 'bg-yellow-500' : 'bg-yellow-900'}`}></div>
        {/* Green light */}
        <div className={`w-4 h-4 rounded-full ${currentLights[3] ? 'bg-green-500' : 'bg-green-900'}`}></div>
      </div>
      <div className="w-2 h-48 bg-gray-800 mx-auto"></div>
    </div>
  );
};

export default RaceTree;
