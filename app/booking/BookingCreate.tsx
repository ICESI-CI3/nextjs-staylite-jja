'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DayPicker } from 'react-day-picker';
import type { DateRange as RDPDateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { useBookingLogic } from './../hooks/useBookingLogic';
import { useOccupiedDates } from '@/app/hooks/useOccupiedDates';

type Props = {
  listingId?: string | string[];
  pricePerNight?: number;
  title?: string;
  onClose: () => void;
  onBooked?: (bookingId: string) => void;
  increaseFromDay?: number;
};

const BookingCreate: React.FC<Props> = ({
  listingId,
  pricePerNight: propPrice,
  title,
  onClose,
  onBooked,
  increaseFromDay = 1,
}) => {
  const router = useRouter();

  const {
    range,
    guests,
    pricePerNight,
    loadingPrice,
    totalPrice,
    nightsWithIncrease,
    error,
    navigating,
    checkInStr,
    checkOutStr,
    disabledRanges,
    setGuests,
    setRange,
    handleGoToPayment,
  } = useBookingLogic({ listingId, propPrice, increaseFromDay, onClose, onBooked });

  const normalizedListingId =
    Array.isArray(listingId) ? listingId[0] : listingId ?? null;

  const { isDateRangeAvailable } = useOccupiedDates(normalizedListingId);

  const checkInDate = range?.from || null;
  const checkOutDate = range?.to || null;

  const checkInStr1 = range?.from ? format(range.from, 'yyyy-MM-dd') : null;
  const checkOutStr1 = range?.to ? format(range.to, 'yyyy-MM-dd') : null;

  const isAvailable = checkInStr1 && checkOutStr1
    ? isDateRangeAvailable(checkInStr1, checkOutStr1)
    : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAvailable) {
      alert('Las fechas seleccionadas no están disponibles. Por favor elige otras fechas.');
      return;
    }
    handleGoToPayment(router as any);
  };

  return (
    <div
      className="absolute top-6 right-6 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl p-5"
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-lg"
        aria-label="Cerrar"
      >
        ✕
      </button>

      {title && <p className="text-sm text-gray-500 mb-1">{title}</p>}
      <h3 className="text-xl font-semibold mb-3">Reservar</h3>

      <div className="mb-3">
        <p className="text-sm text-gray-600 mb-2">Selecciona las fechas</p>
        <DayPicker
          mode="range"
          selected={range as unknown as RDPDateRange}
          onSelect={setRange}
          locale={es}
          disabled={[
            { before: new Date() },
            ...disabledRanges,
          ]}
        />

        {/* Mensaje preventivo */}
        {!isAvailable && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              ⚠️ Estas fechas no están disponibles. Ya existe una reserva confirmada en este período.
            </p>
          </div>
        )}
      </div>

      <div className="mb-3 text-sm text-gray-700">
        <p>Entrada: {checkInStr || '—'}</p>
        <p>Salida: {checkOutStr || '—'}</p>
      </div>

      <div className="mb-3">
        <label className="block text-sm text-gray-700">Huéspedes</label>
        <input
          type="number"
          min={1}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-pink-600"
        />
      </div>

      <div className="mb-4">
        <p className="font-semibold">Precio por noche</p>
        <p className="text-lg font-bold">
          {loadingPrice
            ? 'Cargando...'
            : pricePerNight != null
              ? `$${new Intl.NumberFormat('es-CO').format(pricePerNight)}`
              : '—'}
        </p>
      </div>

      <div className="mb-2">
        <p className="font-semibold">Precio total</p>
        <p className="text-lg font-bold">${new Intl.NumberFormat('es-CO').format(totalPrice)}</p>
        {nightsWithIncrease > 0 && (
          <p className="text-sm text-gray-600">
            {nightsWithIncrease} noche(s) tienen el precio aumentado.
          </p>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={navigating || loadingPrice || !isAvailable}
        className={`w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 transition ${navigating || loadingPrice || !isAvailable ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {navigating ? 'Procesando...' : loadingPrice ? 'Cargando precio...' : 'Ir a pagar'}
      </button>
    </div>
  );
};

export default BookingCreate;
