'use client';
import React from 'react';
import { LodgingDraft } from '@/app/types/types';
import { AMENITIES_GROUPED } from '@/app/constants/amenities'; 

export default function StepAmenities({
  draft, setDraft,
}: { draft: LodgingDraft; setDraft: React.Dispatch<React.SetStateAction<LodgingDraft>> }) {
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Selecciona las comodidades</h2>

      <div className="space-y-8">
        {AMENITIES_GROUPED.map((group) => (
          <section key={group.category}>
            <h3 className="text-xl font-semibold mb-3">{group.category}</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {group.items.map((a) => {
                const checked = draft.amenities.includes(a);
                return (
                  <label
                    key={a}
                    className={`border rounded-lg px-3 py-2 cursor-pointer ${
                      checked ? 'border-blue-600 bg-blue-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={checked}
                      onChange={() =>
                        setDraft(d => ({
                          ...d,
                          amenities: checked
                            ? d.amenities.filter(x => x !== a)
                            : [...d.amenities, a],
                        }))
                      }
                    />
                    {a}
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
