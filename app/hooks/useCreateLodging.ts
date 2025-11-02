'use client';

import { useState } from 'react';
import type { CreateLodgingPayload } from '../types/types';

function getToken(): string | null {
  try {
    return typeof window === 'undefined' ? null : localStorage.getItem('authToken');
  } catch {
    return null;
  }
}

const API_BASE =
    (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '')
      ? process.env.NEXT_PUBLIC_API_URL
      : 'http://localhost:3000';

export function useCreateLodging(baseUrl = API_BASE) {
  console.log('useCreateLodging initialized with baseUrl:', baseUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createLodging(payload: CreateLodgingPayload, files: string[] = []) {
    setLoading(true);
    setError(null);

    console.log('Iniciando creación de alojamiento con payload:', payload);
    console.log('Archivos que se van a enviar:', files);

    try {
      const token = getToken();
      if (!token) {
        const err: any = new Error('No autenticado');
        err.code = 'UNAUTHENTICATED';
        throw err;
      }

      const formData = new FormData();
      
      formData.append('title', String(payload.title).trim());
      formData.append('description', String(payload.description).trim());
      formData.append('pricePerNight', String(payload.pricePerNight ?? 0));
      formData.append('capacity', String(payload.capacity));
      formData.append('rooms', String(payload.rooms));
      formData.append('beds', String(payload.beds));
      formData.append('baths', String(payload.baths));
      formData.append('location', JSON.stringify(payload.location)); 
      formData.append('amenities', JSON.stringify(payload.amenities ?? [])); 

      files.forEach((file, index) => {
        formData.append('images', file);
      });

      console.log('FormData preparado para enviar:', formData);
      const res = await fetch(`${baseUrl}/lodgings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.status === 401 || res.status === 403) {
        const err: any = new Error('No autorizado');
        err.code = 'UNAUTHORIZED';
        throw err;
      }

      if (!res.ok) {
        let msg = `Error ${res.status}`;
        try {
          const body = await res.json();
          msg = Array.isArray(body?.message)
            ? body.message.join(', ')
            : body?.message || msg;
        } catch { }
        throw new Error(msg);
      }

      const json = await res.json();
      console.log('Respuesta del servidor:', json);
      return json;
    } catch (e: any) {
      setError(e?.message ?? 'Fallo creando el alojamiento');
      console.error('Error al crear el alojamiento:', e);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { createLodging, loading, error };
}
