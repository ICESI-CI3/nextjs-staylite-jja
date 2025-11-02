'use client';

import React from 'react';
import Button from '../Button';
import { useRouter } from 'next/navigation';

interface ListingCardProps {
  title: string;
  location: string;
  pricePerNight: string | number;
  images: string[];
  id: string;
  ownerId?: string | { id?: string; _id?: string } | null; 
  onAction?: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({
  title,
  location,
  pricePerNight,
  images,
  id,
  ownerId,
  onAction,
}) => {
  const imageSrc = images && images.length ? images[0] : '';
  const router = useRouter();

  const getCurrentUserInfo = () => {
    try {
      // intentamos userId directo
      let userId = localStorage.getItem('userId');
      if (!userId) {
        const ud = localStorage.getItem('userData');
        if (ud) {
          try {
            const obj = JSON.parse(ud);
            userId = obj?.id ?? obj?._id ?? obj?.userId ?? null;
          } catch {
            userId = null;
          }
        }
      }

      // roles: manejar string/json
      let rolesRaw: any[] = [];
      try {
        const raw = localStorage.getItem('roles');
        if (raw) {
          const parsed = JSON.parse(raw);
          rolesRaw = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch {
        const r = localStorage.getItem('roles');
        if (r) rolesRaw = r.split(',').map(s => s.trim());
      }

      const roles = Array.from(new Set((rolesRaw || []).map((r: any) => String(r || '').trim().toLowerCase()).filter(Boolean)));
      return { userId: userId ? String(userId) : null, roles };
    } catch (err) {
      return { userId: null, roles: [] as string[] };
    }
  };

  // normaliza ownerId recibido (puede ser string, objeto, etc.)
  const normalizeOwnerId = (o?: any): string | null => {
    if (!o && o !== 0) return null;
    if (typeof o === 'string' && o.trim()) return o.trim();
    if (typeof o === 'number') return String(o);
    if (typeof o === 'object') {
      return (o.id ?? o._id ?? null) ? String(o.id ?? o._id) : null;
    }
    return null;
  };

  const handleDetailsClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const { userId, roles } = getCurrentUserInfo();
    const isHost = roles.includes('host') || roles.includes('admin');

    const ownerIdNormalized = normalizeOwnerId(ownerId);

    // logs para depuración
    console.log('ListingCard click -> current userId:', userId, 'roles:', roles);
    console.log('ListingCard click -> ownerId (raw):', ownerId, 'ownerIdNormalized:', ownerIdNormalized, 'isHost:', isHost);

    // Si current user es host y ownerId coincide con userId => ir a /listing/:id/edit
    if (isHost && userId && ownerIdNormalized && String(ownerIdNormalized) === String(userId)) {
      console.log('Navigating to edit mode for listing:', id);
      router.push(`/listing/${id}/edit`);
      return;
    }

    // sino abrir vista pública
    router.push(`/listing/${id}`);

    if (typeof onAction === 'function') onAction();
  };

  const formattedPrice = new Intl.NumberFormat('es-CO').format(Number(pricePerNight ?? 0));

  return (
    <div
      className="w-72 h-72 flex flex-col rounded-md shadow-md overflow-hidden transition-transform hover:scale-105 cursor-pointer bg-white font-sans antialiased"
      onClick={() => handleDetailsClick()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') handleDetailsClick(); }}
    >
      <div className="w-full h-36 flex-shrink-0">
        <img src={imageSrc} alt={title} className="object-cover w-full h-full" />
      </div>

      <div className="px-3 py-2 flex flex-col flex-1">
        <div className="mb-0">
          <h3 className="text-sm font-semibold text-gray-900 leading-tight truncate">{title}</h3>
          <p className="text-xs text-gray-500 leading-tight truncate">{location}</p>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-baseline gap-1">
            <span className="font-semibold text-sm text-gray-800">${formattedPrice}</span>
            <span className="text-xs text-gray-600">/noche</span>
          </div>
        </div>

        <div className="mt-auto pt-1">
          <Button
            label="Ver detalles"
            onClick={(e?: React.MouseEvent<HTMLButtonElement>) => handleDetailsClick(e)}
            className="w-full h-8 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
