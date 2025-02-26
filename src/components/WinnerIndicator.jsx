import React from 'react';

const WinnerIndicator = ({ winner }) => {
  const winnerName = winner === 'car1' ? 'Red Car' : 'Blue Car';

  return (
    <div className="mt-6 text-center">
      <div className="text-2xl font-bold">
        <span className={winner === 'car1' ? 'text-red-600' : 'text-blue-600'}>
          {winnerName}
        </span> Wins!
      </div>
    </div>
  );
};

export default WinnerIndicator;
