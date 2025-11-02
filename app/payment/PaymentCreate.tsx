'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import usePaymentLogic from '../hooks/usePaymentLogic';

export default function PaymentCreate() {
  const search = useSearchParams();
  const bookingIdFromQuery = search.get('bookingId') ?? undefined;

  const {
    localBooking,
    setLocalBooking,
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
              <label className="text-sm text-gray-700">
                Método de pago
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
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
