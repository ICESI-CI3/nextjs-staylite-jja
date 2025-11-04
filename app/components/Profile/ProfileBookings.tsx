'use client';

import { Booking } from '@/app/interfaces/user';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ProfileBookingsProps {
  bookings: Booking[];
  loading: boolean;
}


export const ProfileBookings = ({ bookings, loading }: ProfileBookingsProps) => {
  const router = useRouter();
  const calculateNights = (checkIn: string, checkOut: string): number => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status?: string) => {
    const statusMap = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        label: '⏳ Pendiente'
      },
      confirmed: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        label: '✓ Confirmada'
      },
      cancelled: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        label: '✗ Cancelada'
      },
      completed: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        label: '✓ Completada'
      }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return statusInfo;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No tienes reservas
        </h3>
        <p className="text-gray-500 mb-4">
          Explora alojamientos y haz tu primera reserva
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-[#155dfc] text-white font-semibold rounded-lg hover:bg-blue-600 transition"
        >
          Explorar alojamientos
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          Mis reservas
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({bookings.length})
          </span>
        </h3>
      </div>

      <div className="space-y-4">
        {bookings.map((booking) => {
          const nights = calculateNights(booking.checkIn, booking.checkOut);
          const statusBadge = getStatusBadge(booking.status);

          return (
            <div
              key={booking.id}
              onClick={() => {
                router.push(`/booking/${booking.id}`);
              }}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition cursor-pointer"
            >
              <div className="flex flex-col md:flex-row">
                {/* Imagen del alojamiento */}
                <div className="relative w-full md:w-48 h-40 md:h-auto bg-gray-200 flex-shrink-0">
                  {booking.lodging?.images && booking.lodging.images.length > 0 ? (
                    <Image
                      src={booking.lodging.images[0]}
                      alt={booking.lodging.title || 'Alojamiento'}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                  )}

                  {/* Badge de estado */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                </div>

                {/* Información de la reserva */}
                <div className="flex-1 p-4">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-800 text-lg mb-1">
                        {booking.lodging?.title || 'Alojamiento'}
                      </h4>
                      {booking.lodging?.location?.city && (
                        <p className="text-sm text-gray-600">
                          📍 {booking.lodging.location.city}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#155dfc]">
                        ${booking.totalPrice?.toLocaleString() || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {nights} {nights === 1 ? 'noche' : 'noches'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    {/* Check-in */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Check-in</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {formatDate(booking.checkIn)}
                      </p>
                    </div>

                    {/* Check-out */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Check-out</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {formatDate(booking.checkOut)}
                      </p>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {booking.guests && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          {booking.guests} {booking.guests === 1 ? 'huésped' : 'huéspedes'}
                        </span>
                      )}
                      {booking.createdAt && (
                        <span className="text-xs">
                          Reservado: {formatDate(booking.createdAt)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Ver detalles de booking:', booking.id);
                      }}
                      className="text-[#155dfc] hover:text-blue-600 text-sm font-semibold"
                    >
                      Ver detalles →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};