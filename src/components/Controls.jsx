import React from 'react';

const Controls = ({ onStageCars, disabled }) => {
  return (
    <button
      onClick={onStageCars}
      disabled={disabled}
      className={`px-4 py-2 rounded font-bold ${
        disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
      } text-white`}
    >
      Stage Cars
    </button>
  );
};

export default Controls;
