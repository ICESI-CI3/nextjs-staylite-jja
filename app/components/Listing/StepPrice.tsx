'use client';
import React from 'react';
import { LodgingDraft } from '@/app/types/types';

export default function StepPrice({
  draft, setDraft,
}: { draft: LodgingDraft; setDraft: React.Dispatch<React.SetStateAction<LodgingDraft>> }) {
  return (
    <section className="max-w-md mx-auto min-h-[60vh] flex flex-col justify-center items-center text-center">
      <h2 className="text-3xl font-bold mb-6">Define tu precio por noche</h2>

      <div className="flex items-center justify-center gap-3 w-full">
        <span className="text-2xl select-none">$</span>
        <input
          type="number"
          min={1}
          className="w-full sm:w-80 border rounded-lg px-4 py-2 text-2xl text-center"
          placeholder="150000"
          value={draft.pricePerNight ?? ''}
          onChange={(e) =>
            setDraft(d => ({ ...d, pricePerNight: Number(e.target.value) || null }))
          }
        />
      </div>

      <p className="text-sm text-gray-500 mt-3">En pesos colombianos (COP).</p>
    </section>
  );
}
