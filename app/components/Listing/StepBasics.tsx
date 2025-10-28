'use client';
import React from 'react';
import { Counter } from './Counter';
import { LodgingDraft } from '@/app/types/types';

export default function StepBasics({
  draft, setDraft,
}: { draft: LodgingDraft; setDraft: React.Dispatch<React.SetStateAction<LodgingDraft>> }) {
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Agrega algunos datos básicos sobre tu espacio</h1>
      <p className="text-gray-500 mb-8">Después podrás agregar más información, como los tipos de cama.</p>
      <Counter label="Huéspedes" value={draft.capacity} min={1}
        onChange={(v) => setDraft(d => ({ ...d, capacity: v }))} />
      <Counter label="Habitaciones" value={draft.rooms} min={1}
        onChange={(v) => setDraft(d => ({ ...d, rooms: v }))} />
      <Counter label="Camas" value={draft.beds} min={1}
        onChange={(v) => setDraft(d => ({ ...d, beds: v }))} />
      <Counter label="Baños" value={draft.baths} min={0}
        onChange={(v) => setDraft(d => ({ ...d, baths: v }))} />
    </div>
  );
}
