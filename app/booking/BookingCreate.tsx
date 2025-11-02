'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DayPicker } from 'react-day-picker';
import type { DateRange as RDPDateRange } from 'react-day-picker';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

type Props = {
  listingId?: string | string[]; // aceptar array por seguridad
  pricePerNight?: number;        // opcional: precio base por noche (si se pasa, no hace fetch)
  title?: string;                // opcional: mostrar nombre del listing
  onClose: () => void;
  onBooked?: (bookingId: string) => void; // <-- CAMBIO: ahora recibe bookingId
  increaseFromDay?: number;   // día del mes desde el cual se aplica el aumento (1..31). Default: 1
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
  const resolvedListingId = Array.isArray(listingId) ? listingId[0] : listingId;

  // -------------------------
  // CONFIG: base API URL
  // Usa NEXT_PUBLIC_API_URL si está definido, si no -> localhost:3000
  // -------------------------
  const API_BASE =
    (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '')
      ? process.env.NEXT_PUBLIC_API_URL
      : 'http://localhost:3000';

  const [range, setRange] = useState<RDPDateRange | undefined>(undefined);
  const [guests, setGuests] = useState(1);

  const [pricePerNight, setPricePerNight] = useState<number | null>(propPrice ?? null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const [totalPrice, setTotalPrice] = useState(0);
  const [nightsWithIncrease, setNightsWithIncrease] = useState(0);
  const [error, setError] = useState('');
  const [navigating, setNavigating] = useState(false);

  const computeTotalWithIncreases = useCallback(
    (from?: Date, to?: Date, price?: number | null) => {
      if (!from || !to || price == null) return { total: 0, nightsWithIncrease: 0, nights: 0 };
      let total = 0;
      let nightsInc = 0;

      let current = new Date(from);
      current.setHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setHours(0, 0, 0, 0);

      let nights = 0;
      while (current < end) {
        nights += 1;
        const dayOfMonth = current.getDate();
        const applies = dayOfMonth >= increaseFromDay;
        const nightlyPrice = applies ? price * 2 : price; // duplica si aplica
        total += nightlyPrice;
        if (applies) nightsInc += 1;
        current = addDays(current, 1);
      }

      return { total: Math.round(total), nightsWithIncrease: nightsInc, nights };
    },
    [increaseFromDay]
  );

  // fallback fetch price if propPrice not provided
  useEffect(() => {
    if (propPrice != null) {
      setPricePerNight(propPrice);
      if (range?.from && range?.to) {
        const { total, nightsWithIncrease } = computeTotalWithIncreases(range.from, range.to, propPrice);
        setTotalPrice(total);
        setNightsWithIncrease(nightsWithIncrease);
      }
      return;
    }

    if (!resolvedListingId) {
      setPricePerNight(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const fetchListing = async () => {
      try {
        setLoadingPrice(true);
        setError('');
        const res = await fetch(`${API_BASE}/api/lodgings/${encodeURIComponent(resolvedListingId)}`, {
          method: 'GET',
          signal: controller.signal,
        });

        if (!res.ok) {
          let msg = `Error al cargar el precio (status ${res.status})`;
          try {
            const d = await res.json();
            if (d?.message) msg = d.message;
          } catch {}
          throw new Error(msg);
        }

        const data = await res.json();
        const price =
          typeof data.pricePerNight === 'number'
            ? data.pricePerNight
            : (typeof data.price === 'number' ? data.price : null);

        if (!cancelled) {
          if (price == null) {
            setError('No se encontró el precio del alojamiento.');
            setPricePerNight(null);
          } else {
            setPricePerNight(price);
            if (range?.from && range?.to) {
              const { total, nightsWithIncrease } = computeTotalWithIncreases(range.from, range.to, price);
              setTotalPrice(total);
              setNightsWithIncrease(nightsWithIncrease);
            }
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          if (err.name !== 'AbortError') {
            console.error('Error fetching listing price:', err);
            setError(err.message || 'No se pudo cargar el precio del alojamiento.');
            setPricePerNight(null);
          }
        }
      } finally {
        if (!cancelled) setLoadingPrice(false);
      }
    };

    fetchListing();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [API_BASE, resolvedListingId, propPrice, range, computeTotalWithIncreases]);

  const onRangeSelect = (selected: RDPDateRange | undefined) => {
    setRange(selected);
    setError('');
    if (selected && selected.from && selected.to && pricePerNight != null) {
      const { total, nightsWithIncrease } = computeTotalWithIncreases(selected.from, selected.to, pricePerNight);
      setTotalPrice(total);
      setNightsWithIncrease(nightsWithIncrease);
    } else {
      setTotalPrice(0);
      setNightsWithIncrease(0);
    }
  };

  const checkInStr = range?.from ? format(range.from, 'yyyy-MM-dd') : '';
  const checkOutStr = range?.to ? format(range.to, 'yyyy-MM-dd') : '';

  // ---------- MODIFICACIÓN: enviar SOLO lodgingId, checkIn, checkOut al backend ----------
  const handleGoToPayment = async () => {
    if (navigating) return;
    setError('');

    if (!resolvedListingId) {
      setError('No se pudo identificar el alojamiento.');
      return;
    }
    if (!range || !range.from || !range.to) {
      setError('Selecciona fecha de entrada y salida.');
      return;
    }
    if (pricePerNight == null) {
      setError('Aún no se ha cargado el precio del alojamiento.');
      return;
    }
    if (totalPrice <= 0) {
      setError('Selecciona un rango válido para calcular el precio.');
      return;
    }

    setNavigating(true);

    // payload que guardamos localmente (para PaymentPage)
    const pending = {
      lodgingId: resolvedListingId,
      checkIn: format(range.from, 'yyyy-MM-dd'),
      checkOut: format(range.to, 'yyyy-MM-dd'),
      guests,
      pricePerNight,
      totalPrice,
      nightsWithIncrease,
      createdAt: new Date().toISOString(),
    };

    // PAYLOAD SERVER: SOLO lo que pidió el backend
    const payloadServer = {
      lodgingId: resolvedListingId,
      checkIn: pending.checkIn,
      checkOut: pending.checkOut,
    };

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

      // Si no está autenticado: guardar pendingBooking y redirigir a signup
      if (!token) {
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('pendingBooking', JSON.stringify(pending));
          }
        } catch (e) {
          console.warn('No se pudo guardar pendingBooking en localStorage', e);
        }
        localStorage.setItem('postLoginRedirect', `/payment`);
        localStorage.setItem('signupRole', 'guest');
        onClose();
        await router.push(`/?authOpen=1&tab=signup`);
        return;
      }

      // Con token: usamos API_BASE completo para crear booking (ruta: /bookings)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payloadServer), // <-- aquí enviamos solo lodgingId, checkIn, checkOut
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let errMsg = `Error al crear la reserva (status ${res.status})`;
        try {
          const errData = await res.json();
          if (errData?.message) errMsg = errData.message;
        } catch {}
        setError(errMsg);
        return;
      }

      const data = await res.json();
      const bookingId = data?.id;
      if (!bookingId) {
        setError('Respuesta inesperada del servidor al crear la reserva.');
        return;
      }

      // Guardar pendingPayment para PaymentPage (local)
      try {
        if (typeof window !== 'undefined') {
          const pendingPayment = { bookingId, ...pending };
          localStorage.setItem('pendingPayment', JSON.stringify(pendingPayment));
        }
      } catch (e) {
        console.warn('No se pudo guardar pendingPayment en localStorage', e);
      }

      // --- CAMBIO CLAVE: cerrar modal y notificar al padre con el bookingId ---
      onClose();
      if (onBooked) onBooked(bookingId);

      // (Ya NO navegamos con router.push aquí)
    } catch (err: any) {
      console.error('Error al crear booking / ir a pago:', err);
      if (err?.name === 'AbortError') {
        setError('La solicitud tardó demasiado. Intenta nuevamente.');
      } else {
        setError('Ocurrió un error al preparar el pago. Intenta de nuevo.');
      }
    } finally {
      setNavigating(false);
    }
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
          selected={range}
          onSelect={onRangeSelect}
          locale={es}
          disabled={{ before: new Date() }}
        />
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
        onClick={handleGoToPayment}
        disabled={navigating || loadingPrice}
        className={`w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 transition ${navigating || loadingPrice ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {navigating ? 'Procesando...' : loadingPrice ? 'Cargando precio...' : 'Ir a pagar'}
      </button>
    </div>
  );
};

export default BookingCreate;
