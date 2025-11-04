// app/listing/[listingId]/dashboard/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useLodgingStats } from '@/app/hooks/useLodgingStats';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function LodgingDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const listingId = params.listingId as string;

    const [isRefreshing, setIsRefreshing] = useState(false);

    const { lodging, bookings, stats, loading, error, lastUpdate, refetch } = useLodgingStats(
        listingId,
        { autoRefresh: false }
    );

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const activeRole = localStorage.getItem('activeRole') || localStorage.getItem('viewAs');

        if (!token) {
            router.push('/');
            return;
        }

        if (activeRole !== 'host') {
            router.push(`/listing/${listingId}`);
        }
    }, [router, listingId]);

    const calculateBookingPrice = (checkIn: string, checkOut: string, pricePerNight: number): number => {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return nights * pricePerNight;
    };


    const calculateNights = (checkIn: string, checkOut: string): number => {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const formatRelativeTime = (date: Date | null) => {
        if (!date) return 'Nunca';

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);

        if (diffSecs < 10) return 'Justo ahora';
        if (diffSecs < 60) return `Hace ${diffSecs} segundos`;
        if (diffMins === 1) return 'Hace 1 minuto';
        if (diffMins < 60) return `Hace ${diffMins} minutos`;
        if (diffHours === 1) return 'Hace 1 hora';
        if (diffHours < 24) return `Hace ${diffHours} horas`;

        return date.toLocaleString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refetch();
            await new Promise(resolve => setTimeout(resolve, 500));
        } finally {
            setIsRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="w-16 h-16 border-4 border-[#155dfc] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Cargando estadísticas del alojamiento...</p>
            </div>
        );
    }

    // Error
    if (error || !lodging || !stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white shadow-lg rounded-2xl p-8 max-w-lg border border-red-200">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-red-700">Error al cargar estadísticas</h3>
                        <p className="text-gray-600 text-center">{error || 'No se pudo cargar el alojamiento'}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleRefresh}
                                className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition"
                            >
                                Reintentar
                            </button>
                            <button
                                onClick={() => router.push('/profile')}
                                className="px-6 py-2 bg-[#155dfc] text-white font-semibold rounded-xl hover:bg-blue-600 transition"
                            >
                                Volver al perfil
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 space-y-6">

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/profile')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                ← Volver
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">📊 Estadísticas del Alojamiento</h1>
                                {lastUpdate && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Última actualización: {formatRelativeTime(lastUpdate)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Botón refresh */}
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${isRefreshing
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-50 text-[#155dfc] hover:bg-blue-100'
                                }`}
                        >
                            <svg
                                className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            {isRefreshing ? 'Actualizando...' : 'Actualizar'}
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Imagen */}
                        <div className="relative w-full md:w-64 h-48 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            {lodging.images && lodging.images.length > 0 ? (
                                <Image
                                    src={lodging.images[0]}
                                    alt={lodging.title}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">{lodging.title}</h2>
                            <p className="text-gray-600 mb-2">
                                 {lodging.location?.city}, {lodging.location?.country}
                            </p>
                            <p className="text-gray-700 mb-3 line-clamp-2">{lodging.description}</p>

                            <div className="flex flex-wrap gap-4 text-sm">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                                     ${lodging.pricePerNight}/noche
                                </span>
                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                                     {lodging.capacity} huéspedes
                                </span>
                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                                     {lodging.rooms} habitaciones
                                </span>
                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                                     {lodging.baths} baños
                                </span>
                                <span className={`px-3 py-1 rounded-full font-semibold ${lodging.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {lodging.isActive ? '✓ Activo' : '✗ Inactivo'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tarjetas de estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600">Total Reservas</h3>
                            <span className="text-2xl">📋</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">{stats.totalBookings}</p>
                        <p className="text-xs text-gray-500 mt-1">De diferentes huéspedes</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600">Ingresos Totales</h3>
                            <span className="text-2xl">💵</span>
                        </div>
                        <p className="text-3xl font-bold text-green-600">
                            ${stats.totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Solo confirmadas</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600">Ocupación (30d)</h3>
                            <span className="text-2xl">📊</span>
                        </div>
                        <p className="text-3xl font-bold text-blue-600">{stats.occupancyRate}%</p>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${stats.occupancyRate}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-600">Pendientes</h3>
                            <span className="text-2xl">⏳</span>
                        </div>
                        <p className="text-3xl font-bold text-yellow-600">{stats.pendingBookings}</p>
                        {stats.pendingBookings > 0 && (
                            <p className="text-xs text-yellow-600 mt-1 font-semibold">
                                Requieren acción
                            </p>
                        )}
                    </div>

                </div>

                {/* Desglose por estado */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Desglose por Estado</h3>
                    <div className="grid grid-cols-3 gap-4">

                        <div className="text-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition">
                            <p className="text-2xl font-bold text-green-600">{stats.confirmedBookings}</p>
                            <p className="text-sm text-gray-600 mt-1">✓ Confirmadas</p>
                            {stats.totalBookings > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {Math.round((stats.confirmedBookings / stats.totalBookings) * 100)}%
                                </p>
                            )}
                        </div>

                        <div className="text-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition">
                            <p className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</p>
                            <p className="text-sm text-gray-600 mt-1">⏳ Pendientes</p>
                            {stats.totalBookings > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {Math.round((stats.pendingBookings / stats.totalBookings) * 100)}%
                                </p>
                            )}
                        </div>

                        <div className="text-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition">
                            <p className="text-2xl font-bold text-red-600">{stats.cancelledBookings}</p>
                            <p className="text-sm text-gray-600 mt-1">✗ Canceladas</p>
                            {stats.totalBookings > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {Math.round((stats.cancelledBookings / stats.totalBookings) * 100)}%
                                </p>
                            )}
                        </div>

                    </div>
                </div>

                {/* Reservas recientes (HUÉSPEDES que reservaron TU alojamiento) */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                        🏆 Reservas de Huéspedes
                        <span className="ml-2 text-sm font-normal text-gray-500">
                            ({stats.recentBookings.length})
                        </span>
                    </h3>

                    {stats.recentBookings.length > 0 ? (
                        <div className="space-y-3">
                            {stats.recentBookings.map((booking) => {
                                if (!booking.user) return null;
                                const nights = calculateNights(booking.checkIn, booking.checkOut);
                                const totalPrice = calculateBookingPrice(booking.checkIn, booking.checkOut, lodging.pricePerNight);

                                return (
                                    <div
                                        key={booking.id}
                                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#155dfc] transition group"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {/* Avatar del huésped */}
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-blue-700 font-bold text-lg">
                                                        {booking.user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="font-semibold text-gray-800 group-hover:text-[#155dfc] transition">
                                                        {booking.user.name}
                                                    </span>
                                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                        }`}>
                                                        {booking.status === 'confirmed' ? '✓ Confirmada' :
                                                            booking.status === 'pending' ? '⏳ Pendiente' :
                                                                '✗ Cancelada'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-sm text-gray-600 ml-13">
                                                {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                                                <span className="ml-3">🌙 {nights} noche{nights !== 1 ? 's' : ''}</span>
                                            </div>

                                            <div className="text-xs text-gray-500 mt-1 ml-13">
                                                {booking.user.email}
                                            </div>
                                        </div>

                                        <div className="text-right ml-4">
                                            <p className="text-lg font-bold text-[#155dfc]">
                                                ${totalPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Creada: {booking.createdAt ? formatDate(booking.createdAt) : 'Fecha desconocida'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="font-semibold">No hay reservas todavía</p>
                            <p className="text-sm mt-1">Cuando alguien reserve tu alojamiento, aparecerá aquí</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}