'use client';
import React from 'react';

export default function BottomBar({
  step, stepsTotal, canNext, submitting, creating, onBack, onNext, onPublish,
}: {
  step: number;
  stepsTotal: number;
  canNext: boolean;
  submitting: boolean;
  creating: boolean;
  onBack: () => void;
  onNext: () => void;
  onPublish: () => void;
}) {
  const pct = Math.round(((step + 1) / stepsTotal) * 100);

  return (
    <div className="fixed left-0 right-0 bottom-0 bg-white border-t">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className={`text-gray-700 underline ${step === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
          disabled={step === 0 || submitting || creating}
        >
          Atrás
        </button>

        <div className="flex-1 mx-6">
          <div className="h-1 bg-gray-200 rounded">
            <div className="h-1 bg-black rounded transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {step < stepsTotal - 1 ? (
          <button
            type="button"
            onClick={onNext}
            className={`px-5 py-2 rounded-lg ${canNext ? 'bg-black text-white hover:opacity-90' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
            disabled={!canNext || submitting || creating}
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            onClick={onPublish}
            className={`px-5 py-2 rounded-lg ${canNext ? 'bg-black text-white hover:opacity-90' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
            disabled={!canNext || submitting || creating}
          >
            {submitting || creating ? 'Publicando…' : 'Publicar'}
          </button>
        )}
      </div>
    </div>
  );
}
