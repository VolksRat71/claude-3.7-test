import React from 'react';

const Car = ({ id, position, color, lane }) => {
  const carColors = {
    red: 'bg-red-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-500'
  };

  return (
    <div
      className={`absolute ${lane === 1 ? 'top-[45%]' : 'top-[75%]'} transform -translate-y-1/2 transition-all duration-200 z-10`}
      style={{ left: `${position}%` }}
    >
      {/* Car body */}
      <div className="relative">
        {/* Car shadow */}
        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-black opacity-50 rounded-full blur-sm"></div>

        {/* Car shape */}
        <div className={`h-8 w-16 ${carColors[color] || 'bg-gray-600'} rounded-md relative border border-black`}>
          {/* Windshield */}
          <div className="absolute right-1 top-1 bottom-1 w-4 bg-black bg-opacity-30 rounded-sm"></div>

          {/* Wheels */}
          <div className="absolute -bottom-1 left-2 w-3 h-3 bg-black rounded-full"></div>
          <div className="absolute -bottom-1 right-2 w-3 h-3 bg-black rounded-full"></div>

          {/* Headlights */}
          <div className="absolute left-0 top-1 w-1 h-1 bg-yellow-300 rounded-full"></div>
          <div className="absolute left-0 bottom-1 w-1 h-1 bg-yellow-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Car;
