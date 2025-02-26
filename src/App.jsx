import React, { useState } from 'react';
import RaceTrack from './components/RaceTrack';
import Car from './components/Car';
import RaceTree from './components/RaceTree';
import WinnerIndicator from './components/WinnerIndicator';
import Controls from './components/Controls';

const App = () => {
  // Race state management
  const [racePhase, setRacePhase] = useState('idle'); // idle, staging, ready, racing, finished
  const [isDayTime, setIsDayTime] = useState(true);
  const [winner, setWinner] = useState(null);

  // Car positions (0-100 percentage of track)
  const [carPositions, setCarPositions] = useState({
    car1: 0,
    car2: 0
  });

  // Toggle day/night
  const toggleDayNight = () => {
    setIsDayTime(prev => !prev);
  };

  // Handle staging cars
  const handleStageCars = () => {
    if (racePhase !== 'idle' && racePhase !== 'finished') return;

    // Reset positions
    setCarPositions({ car1: 0, car2: 0 });
    setWinner(null);
    setRacePhase('staging');

    // Move cars to starting line
    setTimeout(() => {
      setCarPositions({ car1: 5, car2: 5 });

      // Ready for race
      setTimeout(() => {
        setRacePhase('ready');

        // Start the race after tree sequence
        setTimeout(() => {
          setRacePhase('racing');
          raceSequence();
        }, 3000);
      }, 2000);
    }, 1000);
  };

  // Race sequence with random winner
  const raceSequence = () => {
    // Random speeds for both cars (slightly different)
    const speed1 = 2 + Math.random() * 1;
    const speed2 = 2 + Math.random() * 1;

    // Animation interval
    const raceInterval = setInterval(() => {
      setCarPositions(prev => {
        const newPos1 = prev.car1 + speed1;
        const newPos2 = prev.car2 + speed2;

        // Check if race is finished
        if (newPos1 >= 95 || newPos2 >= 95) {
          clearInterval(raceInterval);
          setRacePhase('finished');
          setWinner(newPos1 > newPos2 ? 'car1' : 'car2');
        }

        return {
          car1: Math.min(newPos1, 95),
          car2: Math.min(newPos2, 95)
        };
      });
    }, 100);
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Drag Strip Race Simulator</h1>

      <div className="mb-4 flex gap-4">
        <Controls
          onStageCars={handleStageCars}
          disabled={racePhase !== 'idle' && racePhase !== 'finished'}
        />
        <button
          onClick={toggleDayNight}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          {isDayTime ? 'Switch to Night' : 'Switch to Day'}
        </button>
      </div>

      <div className="w-full max-w-4xl bg-white p-4 border shadow-md rounded">
        <RaceTrack isDayTime={isDayTime}>
          <Car
            id="car1"
            position={carPositions.car1}
            color="red"
            lane={1}
          />
          <Car
            id="car2"
            position={carPositions.car2}
            color="blue"
            lane={2}
          />
          <RaceTree
            phase={racePhase}
          />
        </RaceTrack>
      </div>

      {racePhase === 'finished' && (
        <WinnerIndicator winner={winner} />
      )}
    </div>
  );
};

export default App;
