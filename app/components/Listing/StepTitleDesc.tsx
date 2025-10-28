'use client';
import React from 'react';
import { LodgingDraft } from '@/app/types/types';

export default function StepTitleDesc({
  draft, setDraft,
}: { draft: LodgingDraft; setDraft: React.Dispatch<React.SetStateAction<LodgingDraft>> }) {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Ponle un buen título y describe tu espacio</h2>
      <label className="block text-sm text-gray-700 mb-1">Título</label>
      <input
        className="w-full border rounded-lg px-3 py-2 mb-4"
        placeholder="Loft moderno en el centro de Cali"
        value={draft.title}
        onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))}
      />
      <label className="block text-sm text-gray-700 mb-1">Descripción</label>
      <textarea
        className="w-full border rounded-lg px-3 py-2 min-h-[140px]"
        placeholder="Cuenta qué hace único tu espacio, el barrio, vistas, etc."
        value={draft.description}
        onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
      />
      <p className="text-xs text-gray-400 mt-2">Mínimo 20 caracteres.</p>
    </div>
  );
}
