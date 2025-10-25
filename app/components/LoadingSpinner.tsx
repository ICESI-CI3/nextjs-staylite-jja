import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="flex flex-col justify-center items-center space-y-4">
        <FaSpinner className="animate-spin text-blue-600 text-4xl" />
        <p className="text-xl text-gray-700">Cargando información...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
