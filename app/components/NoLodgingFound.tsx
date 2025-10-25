import React from 'react';
import { FaSearch } from 'react-icons/fa';

const NoLodgingFound = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="flex flex-col justify-center items-center space-y-4">
        <FaSearch className="text-gray-600 text-4xl" />
        <p className="text-xl text-gray-600">No se encontró el alojamiento que buscas.</p>
      </div>
    </div>
  );
};

export default NoLodgingFound;
