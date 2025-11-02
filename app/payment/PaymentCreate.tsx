'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type BookingLocal = {
  bookingId?: string;
  lodgingId?: string;
  title?: string;
  checkIn?: string;  
  checkOut?: string;  
  pricePerNight?: number;
  guests?: number;
  totalPrice?: number;
  nightsWithIncrease?: number;
  createdAt?: string;
};

type BookingApi = {
  id: string;
  checkIn: string;    
  checkOut: string;   
  lodging: { id: string; title: string; pricePerNight?: number };
  user?: any;
};

type PayResponse = {
  orderId: string;
  payuOrderId?: string;
  payuPaymentUrl?: string;
  transactionId?: string;
};

type Currency = 'COP' | 'USD';
type PaymentMethod =
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'PSE'
  | 'CASH'
  | 'NEQUI'
  | 'BANCOLOMBIA'
  | 'GOOGLE_PAY';

const PAYMENT_METHODS: PaymentMethod[] = [
  'CREDIT_CARD',
  'DEBIT_CARD',
  'PSE',
  'CASH',
  'NEQUI',
  'BANCOLOMBIA',
  'GOOGLE_PAY',
];

export default function PaymentCreate() {
  const search = useSearchParams();
  const bookingIdFromQuery = search.get('bookingId') ?? undefined;

  const API_BASE =
    (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim())
      || 'http://localhost:3000';

  const [localBooking, setLocalBooking] = useState<BookingLocal | null>(null);
  const [bookingApi, setBookingApi] = useState<BookingApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentRes, setPaymentRes] = useState<PayResponse | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [currency, setCurrency] = useState<Currency>('COP');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PSE');

  const parseISO = (s?: string) => (s ? new Date(s) : null);
  const diffDays = (a?: string, b?: string) => {
    const d1 = parseISO(a);
    const d2 = parseISO(b);
    if (!d1 || !d2) return 0;
    const t1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const t2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
    const msPerDay = 24 * 60 * 60 * 1000;
    const diff = Math.round((t2 - t1) / msPerDay);
    return Math.max(diff, 0);
  };

  const amount = useMemo(() => {
    if (typeof localBooking?.totalPrice === 'number' && localBooking.totalPrice > 0) {
      return localBooking.totalPrice;
    }
    const pricePerNight =
      typeof localBooking?.pricePerNight === 'number'
        ? localBooking.pricePerNight
        : (typeof bookingApi?.lodging?.pricePerNight === 'number'
            ? bookingApi!.lodging.pricePerNight!
            : 0);

    const nights = localBooking?.nightsWithIncrease && localBooking.nightsWithIncrease > 0
      ? localBooking.nightsWithIncrease
      : diffDays(
          localBooking?.checkIn ?? bookingApi?.checkIn,
          localBooking?.checkOut ?? bookingApi?.checkOut
        );

    const a = Number(pricePerNight) * Number(nights || 0);
    return isFinite(a) ? a : 0;
  }, [localBooking, bookingApi]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const c = (localStorage.getItem('currency') || '').toUpperCase();
      if (c === 'COP' || c === 'USD') setCurrency(c as Currency);

      const pm = (localStorage.getItem('paymentMethod') || '').toUpperCase() as PaymentMethod;
      if (PAYMENT_METHODS.includes(pm)) setPaymentMethod(pm);
    }

    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('pendingPayment') ?? localStorage.getItem('pendingBooking');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (!bookingIdFromQuery || String(parsed.bookingId) === String(bookingIdFromQuery))) {
            setLocalBooking(parsed);
            setShowModal(true);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('No se pudo leer pendingPayment/localStorage:', e);
    }

    if (!bookingIdFromQuery) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/bookings/${encodeURIComponent(bookingIdFromQuery)}`, {
      signal: controller.signal,
      credentials: 'include',
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Booking no encontrado (status ${r.status})`);
        return r.json();
      })
      .then((data: BookingApi) => {
        setBookingApi(data);
        setShowModal(true);
      })
      .catch((e) => setError(e?.message || 'Error al cargar booking'))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [API_BASE, bookingIdFromQuery]);

  const effective = {
    title: localBooking?.title ?? bookingApi?.lodging?.title ?? 'Alojamiento',
    checkIn: localBooking?.checkIn ?? bookingApi?.checkIn,
    checkOut: localBooking?.checkOut ?? bookingApi?.checkOut,
    pricePerNight:
      localBooking?.pricePerNight ?? bookingApi?.lodging?.pricePerNight ?? null,
    guests: localBooking?.guests ?? 1,
    totalPrice: localBooking?.totalPrice ?? null,
    bookingId: localBooking?.bookingId ?? bookingApi?.id ?? bookingIdFromQuery,
  };

  const handleCreatePayment = async () => {
    if (!effective.bookingId) {
      setError('Falta bookingId para crear la orden.');
      return;
    }
    if (creating) return;

    setCreating(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

      if (!amount || amount <= 0) {
        throw new Error('El monto (amount) calculado debe ser mayor que 0.');
      }

      const body = {
        bookingId: String(effective.bookingId),
        amount,                  
        currency,                
        paymentMethod,          
      };

      const res = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let message = `Error ${res.status}`;
        try {
          const err = await res.json();
          if (err?.message) message = Array.isArray(err.message) ? err.message.join(', ') : err.message;
        } catch {}
        throw new Error(message);
      }

      const data: PayResponse = await res.json();
      setPaymentRes(data);

      if (data.payuPaymentUrl) {
        const w = window.open('', '_blank', 'noopener,noreferrer');
        if (w) w.location.href = data.payuPaymentUrl;
      }
    } catch (e: any) {
      console.error('Error crear payment:', e);
      setError(e?.message || 'Error al crear pago');
    } finally {
      setCreating(false);
    }
  };

  // persistir preferencias cuando cambien
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('currency', currency);
      localStorage.setItem('paymentMethod', paymentMethod);
    }
  }, [currency, paymentMethod]);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-gray-800/20 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 mt-12 md:mt-0">
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-lg"
          aria-label="Cerrar"
        >
          ✕
        </button>

        <h3 className="text-xl font-semibold mb-4 text-center text-[#0E2159]">
          Confirmar pago
        </h3>

        {loading ? (
          <p className="text-center text-gray-600">Cargando...</p>
        ) : error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-1 text-center">{effective.title}</p>

            <div className="text-sm text-gray-700 mb-3 text-center">
              <p>Entrada: {effective.checkIn ?? '—'}</p>
              <p>Salida: {effective.checkOut ?? '—'}</p>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3">
              {/* NUEVO: selector de método de pago */}
              <label className="text-sm text-gray-700">
                Método de pago
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                >
                  {PAYMENT_METHODS.map(pm => (
                    <option key={pm} value={pm}>
                      {pm.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>

              {/* Opcional: selector de moneda */}
              <label className="text-sm text-gray-700">
                Moneda
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                >
                  <option value="COP">COP</option>
                  <option value="USD">USD</option>
                </select>
              </label>
            </div>

            <div className="mb-4 text-center">
              <p className="font-semibold">Precio total</p>
              <p className="text-lg font-bold text-[#0E2159]">
                {amount > 0
                  ? `${currency} $${new Intl.NumberFormat('es-CO').format(amount)}`
                  : '—'}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreatePayment}
                disabled={creating || amount <= 0}
                className={`flex-1 bg-[#0E2159] text-white py-2 rounded-lg hover:bg-[#1B2F7C] transition ${
                  creating || amount <= 0 ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {creating ? 'Procesando...' : 'Ir a pagar'}
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancelar
              </button>
            </div>

            {paymentRes && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">Orden: {paymentRes.orderId}</p>
                {paymentRes.payuPaymentUrl && (
                  <a
                    href={paymentRes.payuPaymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-pink-600 underline"
                  >
                    Completar pago en PayU
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
