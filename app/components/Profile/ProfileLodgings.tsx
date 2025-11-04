// app/components/Profile/ProfileLodgings.tsx
'use client';


import { Lodging } from '@/app/interfaces/lodging';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ProfileLodgingsProps {
  lodgings: Lodging[];
  loading: boolean;
}

export const ProfileLodgings = ({ lodgings, loading }: ProfileLodgingsProps) => {
  const router = useRouter();

  const activeRole = typeof window !== 'undefined' 
    ? (localStorage.getItem('activeRole') || localStorage.getItem('viewAs') || 'guest')
    : 'guest';

  const handleLodgingClick = (lodgingId: string) => {
    if (activeRole === 'host') {
      router.push(`/listing/${lodgingId}/dashboard`);
    } else {
      router.push(`/listing/${lodgingId}`);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (lodgings.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No tienes alojamientos
        </h3>
        <p className="text-gray-500 mb-4">
          Comienza a publicar tus propiedades para recibir huéspedes
        </p>
        <button
          onClick={() => router.push('/listing/new')}
          className="px-6 py-2 bg-[#155dfc] text-white font-semibold rounded-lg hover:bg-blue-600 transition"
        >
          Crear primer alojamiento
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          Mis alojamientos
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({lodgings.length})
          </span>
        </h3>
        <button
          onClick={() => router.push('/listing/new')}
          className="px-4 py-2 bg-[#155dfc] text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition"
        >
          + Nuevo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lodgings.map((lodging) => (
          <div
            key={lodging.id}
            onClick={() => router.push(`/listing/${lodging.id}/dashboard`)}
            className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition cursor-pointer"
          >
            {/* Imagen */}
            <div className="relative h-40 bg-gray-200">
              {lodging.images && lodging.images.length > 0 ? (
                <Image
                  src={lodging.images[0]}
                  alt={lodging.title}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              
              {/* Badge de estado */}
              {lodging.isActive !== undefined && (
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    lodging.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {lodging.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              )}
            </div>

            {/* Información */}
            <div className="p-4">
              <h4 className="font-semibold text-gray-800 mb-1 truncate">
                {lodging.title}
              </h4>
              
              <p className="text-sm text-gray-600 mb-2">
                {lodging.location?.city && lodging.location?.country
                  ? `${lodging.location.city}, ${lodging.location.country}`
                  : lodging.location?.city || 'Ubicación no especificada'}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-[#155dfc]">
                  ${lodging.pricePerNight}
                  <span className="text-sm font-normal text-gray-600"> /noche</span>
                </span>

                {lodging.capacity && (
                  <span className="text-sm text-gray-600">
                    {lodging.capacity} huéspedes
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};