// app/profile/page.tsx
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useProfile } from '../hooks/useProfile';
import { useProfileData } from '../hooks/useProfileData';
import { useEffect } from 'react';
import { ProfileLodgings } from '../components/Profile/ProfileLodgings';
import { ProfileBookings } from '../components/Profile/ProfileBookings';


export default function ProfilePage() {
  const router = useRouter();

  const { user, loading, error } = useProfile();

  const { 
    lodgings, 
    bookings, 
    loadingLodgings,
    loadingBookings 
  } = useProfileData(user?.id || null, user?.roles || []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token && !loading) {
      router.push('/');
    }
  }, [router, loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-16 bg-gray-50">
        <div className="bg-white shadow-lg rounded-2xl p-8 w-[90%] max-w-4xl border border-gray-100">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-[#155dfc] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Estado de error
   */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-16 bg-gray-50">
        <div className="bg-white shadow-lg rounded-2xl p-8 w-[90%] max-w-4xl border border-red-200">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-700">Error al cargar el perfil</h3>
            <p className="text-gray-600 text-center whitespace-pre-line">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-6 py-2 bg-[#155dfc] text-white font-semibold rounded-xl shadow-md hover:bg-blue-600 transition"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }


  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-16 bg-gray-50">
        <div className="bg-white shadow-lg rounded-2xl p-8 w-[90%] max-w-4xl border border-gray-100">
          <p className="text-center text-gray-600">No se encontró información del usuario.</p>
        </div>
      </div>
    );
  }


  const activeRole = localStorage.getItem('activeRole') || localStorage.getItem('viewAs') || '';
  const isHost = activeRole === 'host';
  const isGuest = activeRole === 'guest';
  
  // Para debug - puedes eliminarlo después
  console.log('👤 Rol activo:', activeRole);
  console.log('🏠 Mostrar como host:', isHost);
  console.log('👥 Mostrar como guest:', isGuest);

  return (
    <div className="min-h-screen py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        
        {/* Tarjeta de información personal */}
        <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
          
          {/* Avatar y nombre */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full border-4 border-[#155dfc] bg-blue-100 flex items-center justify-center shadow-md">
                <span className="text-3xl font-bold text-[#155dfc]">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            
            {/* Información principal */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {user.name}
              </h1>
              <p className="text-gray-600 mb-4">{user.email}</p>
              
              {/* Roles badges */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                {user.roles.map((role) => {
                  const isActive = activeRole === role;
                  return (
                    <button
                      key={role}
                      onClick={() => {
                        // Cambiar el rol activo
                        localStorage.setItem('activeRole', role);
                        localStorage.setItem('viewAs', role);
                        // Disparar evento para que otros componentes se actualicen
                        window.dispatchEvent(new CustomEvent('role:changed', { 
                          detail: { activeRole: role } 
                        }));
                        // Recargar la página para actualizar los datos
                        window.location.reload();
                      }}
                      className={`px-3 py-1 text-sm font-semibold rounded-full transition ${
                        isActive 
                          ? 'bg-[#155dfc] text-white shadow-md' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {role === 'host' ? '🏠 Host' : role === 'guest' ? '👤 Guest' : '👑 ' + role}
                      {isActive && ' ✓'}
                    </button>
                  );
                })}
              </div>
              
              {user.roles.length > 1 && (
                <p className="text-xs text-gray-500 text-center md:text-left">
                  💡 Haz clic en un rol para cambiar la vista del perfil
                </p>
              )}
            </div>

            {/* Botón de volver */}
            <button
              onClick={() => router.push('/')}
              className="md:self-start px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
            >
              ← Volver
            </button>
          </div>

          {/* Información adicional */}
          <div className="border-t border-gray-200 mt-6 pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* ID */}
            <div>
              <span className="text-sm font-medium text-gray-500 block mb-1">ID</span>
              <span className="text-sm text-gray-800 font-mono break-all">
                {user.id}
              </span>
            </div>

            {/* Estado */}
            <div>
              <span className="text-sm font-medium text-gray-500 block mb-1">Estado</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-semibold ${
                user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {user.isActive ? '✓ Activo' : '✗ Inactivo'}
              </span>
            </div>

            {/* 2FA */}
            {user.twoFactorSecret && (
              <div>
                <span className="text-sm font-medium text-gray-500 block mb-1">Seguridad</span>
                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  🔒 2FA Habilitado
                </span>
              </div>
            )}
          </div>

          {/* Estadísticas rápidas - Solo del rol activo */}
          {(isHost || isGuest) && (
            <div className="border-t border-gray-200 mt-6 pt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-3">
                Vista actual: {isHost ? '🏠 Host' : '👤 Guest'}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {isHost && (
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-[#155dfc]">
                      {lodgings.length}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Alojamientos</p>
                  </div>
                )}

                {isGuest && (
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {bookings.length}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Reservas</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Alojamientos (si es host) */}
        {isHost && (
          <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
            <ProfileLodgings 
              lodgings={lodgings} 
              loading={loadingLodgings} 
            />
          </div>
        )}

        {/* Reservas (si es guest) */}
        {isGuest && (
          <div className="bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
            <ProfileBookings 
              bookings={bookings} 
              loading={loadingBookings} 
            />
          </div>
        )}

        {/* Botón de editar perfil (deshabilitado por ahora) */}
        <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
          <button
          onClick={() => router.push('/profile/edit')}
            className="w-full bg-[#155dfc] text-white font-semibold py-3 rounded-xl shadow-md hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✏️ Editar información
          </button>
        </div>

      </div>
    </div>
  );
}