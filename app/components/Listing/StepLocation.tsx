'use client';
import React from 'react';
import { LodgingDraft } from '@/app/types/types';
import LodgingMap from '@/app/components/Listing/Map';

export default function StepLocation({
  draft, setDraft,
}: { draft: LodgingDraft; setDraft: React.Dispatch<React.SetStateAction<LodgingDraft>> }) {

  const [geoLoading, setGeoLoading] = React.useState(false);
  const [geoError, setGeoError] = React.useState<string | null>(null);

  // Debounce: geocodificar cuando cambien address/city/country
  React.useEffect(() => {
    const { address, city, country } = draft.location;
    const query = [address, city, country].filter(Boolean).join(', ').trim();

    if (!query || query.length < 4) return; // evita consultas muy cortas

    setGeoError(null);
    const t = setTimeout(async () => {
      try {
        setGeoLoading(true);
        const key = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
        const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${key}&limit=1`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('No se pudo geocodificar');

        const data = await res.json();
        const feature = data?.features?.[0];
        const center: [number, number] | undefined = feature?.center;

        if (Array.isArray(center) && center.length === 2) {
          const [lng, lat] = center;
          setDraft(d => ({
            ...d,
            location: { ...d.location, coordinates: { lat, lng } },
          }));
        } else {
          setGeoError('No se encontró una ubicación precisa. Ajusta la dirección.');
        }
      } catch (e: any) {
        setGeoError(e?.message ?? 'Fallo al geocodificar');
      } finally {
        setGeoLoading(false);
      }
    }, 600); // 👈 debounce

    return () => clearTimeout(t);
  }, [draft.location.address, draft.location.city, draft.location.country, setDraft]);

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">¿Dónde está tu lugar?</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Ciudad</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={draft.location.city}
            onChange={(e) =>
              setDraft(d => ({ ...d, location: { ...d.location, city: e.target.value } }))
            }
            placeholder="Cali"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">País</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={draft.location.country ?? ''}
            onChange={(e) =>
              setDraft(d => ({ ...d, location: { ...d.location, country: e.target.value } }))
            }
            placeholder="Colombia"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm text-gray-700 mb-1">Dirección</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={draft.location.address}
            onChange={(e) =>
              setDraft(d => ({ ...d, location: { ...d.location, address: e.target.value } }))
            }
            placeholder="Cra 1 # 2-34, San Antonio"
          />
          <p className="text-xs text-gray-500 mt-1">
            El mapa se actualizará automáticamente con esta información.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="h-96">
          <LodgingMap
            lat={draft.location.coordinates.lat || 3.4516}
            lng={draft.location.coordinates.lng || -76.5320}
            title={draft.title || 'Ubicación del alojamiento'}
            heightClass="h-96"
            interactive={false} // 👈 desactivamos la interacción del usuario
          />
        </div>

        <div className="mt-2 flex items-center gap-3">
          <p className="text-xs text-gray-500">
            Coord: {draft.location.coordinates.lat.toFixed(6)}, {draft.location.coordinates.lng.toFixed(6)}
          </p>
          {geoLoading && <span className="text-xs text-blue-600">Actualizando mapa…</span>}
          {geoError && <span className="text-xs text-red-600">{geoError}</span>}
        </div>
      </div>
    </div>
  );
}
