'use client';
import React from 'react';

export const Counter: React.FC<{
  label: string;
  value: number;
  min?: number;
  onChange: (v: number) => void;
  disabledMinus?: boolean;
}> = ({ label, value, min = 0, onChange, disabledMinus }) => (
  <div className="flex items-center justify-between py-4 border-b">
    <span className="text-gray-800">{label}</span>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`w-8 h-8 rounded-full border flex items-center justify-center ${
          (value <= min || disabledMinus) ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'
        }`}
        disabled={value <= min || disabledMinus}
        aria-label={`Disminuir ${label}`}
      >
        –
      </button>
      <span className="w-6 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
        aria-label={`Aumentar ${label}`}
      >
        +
      </button>
    </div>
  </div>
);
