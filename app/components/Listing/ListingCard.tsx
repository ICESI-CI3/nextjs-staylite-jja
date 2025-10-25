'use client';

import React from 'react';
import Button from '../Button';
import { useRouter } from 'next/navigation';

interface ListingCardProps {
  title: string;
  location: string;
  pricePerNight: string;
  images: string[];
  id: string;
  onAction: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({
  title,
  location,
  pricePerNight,
  images,
  id,
  onAction,
}) => {
  const imageSrc = images && images.length ? images[0] : '';
  const router = useRouter();

  const handleDetailsClick = () => {
    console.log('Navigating to listing with ID:', id);
    router.push(`/listing/${id}`);
  };

  // Formateamos el precio para agregar el punto como separador de miles
  const formattedPrice = new Intl.NumberFormat('es-CO').format(Number(pricePerNight));

  return (
    <div className="w-72 h-72 flex flex-col rounded-md shadow-md overflow-hidden transition-transform hover:scale-105 cursor-pointer bg-white font-sans antialiased">
      <div className="w-full h-36 flex-shrink-0">
        <img
          src={imageSrc}
          alt={title}
          className="object-cover w-full h-full"
        />
      </div>

      <div className="px-3 py-2 flex flex-col flex-1">
        <div className="mb-0">
          <h3 className="text-sm font-semibold text-gray-900 leading-tight truncate">{title}</h3>
          <p className="text-xs text-gray-500 leading-tight truncate">{location}</p>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-baseline gap-1">
            <span className="font-semibold text-sm text-gray-800">
              ${formattedPrice}
            </span>
            <span className="text-xs text-gray-600">/noche</span>
          </div>
        </div>

        <div className="mt-auto pt-1">
          <Button
            label="Ver detalles"
            onClick={handleDetailsClick}
            className="w-full h-8 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
