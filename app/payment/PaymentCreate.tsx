'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import usePaymentLogic from '../hooks/usePaymentLogic';

export default function PaymentCreate() {
  const search = useSearchParams();
  const router = useRouter();
  const bookingIdFromQuery = search.get('bookingId') ?? undefined;

  const {
    localBooking,
    bookingApi,
    loading,
    creating,
    error,
    paymentRes,
    showModal,
    setShowModal,
    currency,
    setCurrency,
    paymentMethod,
    setPaymentMethod,
    amount,
    effective,
    handleCreatePayment,
  } = usePaymentLogic(bookingIdFromQuery);

  const handlePaymentClick = async () => {
    try {
      const res = await handleCreatePayment();
      if (res && effective.bookingId) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pendingPayment');
          localStorage.removeItem('pendingBooking');
        }
        router.push(`/booking/${effective.bookingId}`);
      }
    } catch (err) {
      console.error('Error procesando el pago:', err);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-gray-800/20 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 mt-12 md:mt-0">
        <button
          onClick={() => {
            setShowModal(false);
            router.back();
          }}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-lg"
          aria-label="Cerrar"
        >
          ✕
        </button>

        <h3 className="text-xl font-semibold mb-4 text-center text-[#0E2159]">
          Confirmar pago
        </h3>

        {loading ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-[#0E2159] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-600">Cargando información...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            >
              Volver
            </button>
          </div>
        ) : paymentRes ? (
          <div className="text-center py-8">
            <h4 className="text-lg font-semibold mb-2">Pago procesado</h4>
            <p className="text-sm text-gray-600 mb-4">
              ID de transacción: <span className="font-mono">{paymentRes.transactionId}</span>
            </p>
            <button
              onClick={() => router.push(`/booking/${effective.bookingId}`)}
              className="w-full bg-[#0E2159] text-white py-3 rounded-lg hover:bg-[#1B2F7C] transition"
            >
              Ver detalle de la reserva
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-1 text-center">{effective.title}</p>

            <div className="text-sm text-gray-700 mb-3 text-center">
              <p>Entrada: {effective.checkIn ?? '—'}</p>
              <p>Salida: {effective.checkOut ?? '—'}</p>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3">
              <label className="text-sm text-gray-700">
                Método de pago
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  disabled={creating}
                >
                  {['CREDIT_CARD','DEBIT_CARD','PSE','CASH','NEQUI','BANCOLOMBIA','GOOGLE_PAY'].map(pm => (
                    <option key={pm} value={pm}>{pm.replace('_',' ')}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-gray-700">
                Moneda
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  disabled={creating}
                >
                  <option value="COP">COP</option>
                  <option value="USD">USD</option>
                </select>
              </label>
            </div>

            <div className="mb-4 text-center bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Precio total</p>
              <p className="text-2xl font-bold text-[#0E2159]">
                {amount > 0
                  ? `${currency} $${new Intl.NumberFormat('es-CO').format(amount)}`
                  : '—'}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePaymentClick}
                disabled={creating || amount <= 0}
                className={`flex-1 bg-[#0E2159] text-white py-3 rounded-lg hover:bg-[#1B2F7C] transition font-semibold ${
                  creating || amount <= 0 ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {creating ? 'Procesando...' : 'Pagar ahora'}
              </button>

              <button
                onClick={() => {
                  setShowModal(false);
                  router.back();
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                disabled={creating}
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
