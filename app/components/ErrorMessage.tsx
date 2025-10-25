import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const ErrorMessage = ({ message }: { message: string }) => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="flex flex-col justify-center items-center space-y-4">
        <FaExclamationTriangle className="text-red-600 text-4xl" />
        <p className="text-xl text-red-600">{message}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
