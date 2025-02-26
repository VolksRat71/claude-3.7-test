import React from 'react';

const RaceTrack = ({ children, isDayTime }) => {
  return (
    <div className={`relative w-full h-96 border-2 border-black rounded-lg overflow-hidden transition-colors duration-1000 ${
      isDayTime ? 'bg-gray-300' : 'bg-gray-800'
    }`} style={{minHeight: "350px"}}>
      {/* Track */}
      <div className="absolute inset-0 flex flex-col">
        {/* Sky */}
        <div className={`h-1/3 transition-colors duration-1000 ${
          isDayTime ? 'bg-blue-300' : 'bg-gray-900'
        }`}></div>

        {/* Track surface */}
        <div className="h-2/3 bg-gray-600 flex flex-col">
          {/* Lane markings */}
          <div className="h-full flex">
            <div className="w-full h-full flex flex-col justify-between relative">
              {/* Lanes */}
              <div className="absolute inset-0 flex flex-col">
                <div className="h-1/2 border-b-2 border-white"></div>
                <div className="h-1/2"></div>
              </div>

              {/* Start line */}
              <div className="absolute left-[5%] top-0 bottom-0 w-1 bg-white"></div>

              {/* Finish line */}
              <div className="absolute left-[95%] top-0 bottom-0 w-1 bg-white"></div>

              {/* Distance markers */}
              {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(pos => (
                <div key={pos} className="absolute top-0 bottom-0 w-px bg-white opacity-50"
                     style={{ left: `${pos}%` }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Shadows */}
      {isDayTime && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-black to-transparent opacity-10"></div>
        </div>
      )}

      {/* Children (cars, tree) */}
      {children}
    </div>
  );
};

export default RaceTrack;
