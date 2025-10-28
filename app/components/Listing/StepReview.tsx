'use client';

import React from 'react';
import { LodgingDraft } from '@/app/types/types';
import LodgingMap from '@/app/components/Listing/Map';

export default function StepReview({ draft }: { draft: LodgingDraft }) {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Revisa tu publicación</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-1">Título</h3>
          <p>{draft.title || '—'}</p>
          <h3 className="font-semibold mt-4 mb-1">Descripción</h3>
          <p className="whitespace-pre-wrap">{draft.description || '—'}</p>
          <h3 className="font-semibold mt-4 mb-1">Precio</h3>
          <p>{draft.pricePerNight ? `$ ${new Intl.NumberFormat('es-CO').format(draft.pricePerNight)} / noche` : '—'}</p>
          <h3 className="font-semibold mt-4 mb-1">Capacidad</h3>
          <p>{draft.capacity} huéspedes — {draft.rooms} hab — {draft.beds} camas — {draft.baths} baños</p>
          <h3 className="font-semibold mt-4 mb-1">Comodidades</h3>
          <p>{draft.amenities.length ? draft.amenities.join(', ') : '—'}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Ubicación</h3>
          <p className="mb-2">
            {draft.location.address}, {draft.location.city}
            {draft.location.country ? ` (${draft.location.country})` : ''}
          </p>
          <div className="h-56 rounded overflow-hidden">
            <LodgingMap
              lat={draft.location.coordinates.lat || 3.4516}
              lng={draft.location.coordinates.lng || -76.5320}
              title={draft.title || 'Tu alojamiento'}
              heightClass="h-56"
            />
          </div>
          <h3 className="font-semibold mt-4 mb-2">Fotos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {draft.images && draft.images.length > 0 ? (
              draft.images.map((src, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded overflow-hidden">
                  {src ? (
                    <img
                      src={src}
                      alt={`Imagen ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      Sin URL
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                No se han cargado imágenes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
