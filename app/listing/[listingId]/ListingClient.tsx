'use client';

import React from 'react';
import { Navbar } from '@/app/components/NavBar/NavBar';
import LodgingMap from '@/app/components/Listing/Map';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ErrorMessage from '@/app/components/ErrorMessage';
import NoLodgingFound from '@/app/components/NoLodgingFound';
import BookingCreate from '@/app/booking/BookingCreate';
import PaymentCreate from '@/app/payment/PaymentCreate';
import useListingLogic from '@/app/hooks/useListingLogic';
import { useParams } from 'next/navigation';

const ListingClient = () => {
  const { listingId } = useParams();
  const {
    lodging,
    loading,
    error,

    showBooking,
    setShowBooking,
    showPayment,
    pendingBookingId,

    handleReserveNow,
    handleReturnHomeRestore,
    handleGoBack,
    handleBookingCreated,

    formattedPrice,
    city,
    address,
    coordinates,
    amenities,
    capacity,
    rooms,
    beds,
    baths,
    mainImage,
  } = useListingLogic(listingId as string | undefined);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Ocurrió un error al cargar los datos. Intenta nuevamente." />;
  if (!lodging) return <NoLodgingFound />;

  return (
    <div>
      <Navbar onSearch={() => { }} />
      <div className="container mx-auto px-4 py-8 relative">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={handleGoBack}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800"
          >
            ← Volver
          </button>

          <button
            onClick={handleReturnHomeRestore}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Volver al inicio (mantener mi vista)
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:space-x-8 mb-8">
          <div className="w-full md:w-1/2 mb-6 md:mb-0">
            <div className="w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
              {mainImage ? (
                <img src={mainImage} alt={lodging.title} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">Sin imagen principal</div>
              )}
            </div>
          </div>

          <div className="w-full md:w-1/2">
            <h1 className="text-3xl font-bold text-gray-900">{lodging.title}</h1>
            <p className="text-xl text-gray-600">{city}, {address}</p>

            <div className="flex items-center mt-4">
              <span className="text-2xl font-semibold text-gray-800">${formattedPrice} / noche</span>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Detalles</h3>
              <div className="flex flex-wrap gap-3 text-gray-700">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">
                  👥 {capacity} huésped{capacity === 1 ? '' : 'es'}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">
                  🛏️ {beds} cama{beds === 1 ? '' : 's'}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">
                  🚪 {rooms} habitación{rooms === 1 ? '' : 'es'}
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">
                  🛁 {baths} baño{baths === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleReserveNow}
                className="bg-pink-600 text-white px-16 py-5 rounded-2xl text-xl font-bold shadow-lg hover:bg-fuchsia-300 hover:scale-105 transition-transform duration-200 w-full max-w-md"
              >
                Reservar ahora
              </button>
            </div>

            {/* Modal de Booking */}
            {showBooking && (
              <BookingCreate
                listingId={Array.isArray(listingId) ? listingId[0] : listingId}
                pricePerNight={Number(lodging.pricePerNight)}
                title={lodging.title}
                onClose={() => setShowBooking(false)}
                onBooked={(bookingId: string) => handleBookingCreated(bookingId)}
              />
            )}

            {/* Modal de Payment (abre encima del listing, mismo estilo) */}
            {showPayment && pendingBookingId && (
              <PaymentCreate />
            )}

            <div className="mt-6 mb-6">
              <p className="text-lg text-gray-700">{lodging.description}</p>
            </div>

            {amenities.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Comodidades</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700">
                  {amenities.map((amenity: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 bg-blue-600 rounded-full" />
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {coordinates?.lat != null && coordinates?.lng != null && (
          <div className="mt-8">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Ubicación</h3>
            <LodgingMap
              lat={coordinates.lat}
              lng={coordinates.lng}
              title={lodging.title}
              heightClass="h-96"
            />
          </div>
        )}

        {lodging.images?.length > 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            {lodging.images.slice(1).map((image: string, index: number) => (
              <div key={index} className="overflow-hidden rounded-lg shadow-lg">
                <img src={image} alt={`Image ${index + 2}`} className="object-cover w-full h-64" />
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
            Mostrar todas las fotos
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListingClient;
