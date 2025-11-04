'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useFetchLodging from './useFetchLodgingid';

const LS = {
  ACTIVE: 'activeRole',
  VIEWAS: 'viewAs',
  PREV: 'prevActiveRole',
  AUTH: 'authToken',
  POST_LOGIN: 'postLoginRedirect',
  SIGNUP_ROLE: 'signupRole',
};

export default function useListingLogic(listingId?: string | string[]) {
  const router = useRouter();

  const [showBooking, setShowBooking] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);

  const resolvedListingId = Array.isArray(listingId) ? listingId[0] : listingId;
  const { lodging, loading, error } = useFetchLodging(resolvedListingId as string);

  useEffect(() => {
    try {
      const current = localStorage.getItem(LS.ACTIVE) ?? localStorage.getItem(LS.VIEWAS) ?? null;
      if (current) {
        localStorage.setItem(LS.PREV, current);
      }
    } catch (err) {
    }
  }, []);

  const handleReserveNow = async () => {
    if (navigating) return;
    setNavigating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem(LS.AUTH) : null;
      const redirectTo = `/booking`;

      if (token) {
        setShowBooking(true);
      } else {
        localStorage.setItem(LS.POST_LOGIN, redirectTo);
        localStorage.setItem(LS.SIGNUP_ROLE, 'guest');
        await router.push(`/?authOpen=1&tab=signup`);
      }
    } catch (err) {
      console.error('Error en handleReserveNow:', err);
    } finally {
      setNavigating(false);
    }
  };

  const handleReturnHomeRestore = () => {
    try {
      const prev = localStorage.getItem(LS.PREV);
      if (prev) {
        localStorage.setItem(LS.ACTIVE, prev);
        localStorage.setItem(LS.VIEWAS, prev);

        window.dispatchEvent(new CustomEvent('role:changed', { detail: { activeRole: prev } }));
        window.dispatchEvent(new CustomEvent('view:changed', { detail: { viewAs: prev } }));

        window.dispatchEvent(new Event('auth:updated'));
      }
    } catch (err) {
      console.error('Error al restaurar vista previa:', err);
    } finally {
      router.push('/');
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleBookingCreated = (bookingId: string) => {
    setShowBooking(false);

    setPendingBookingId(bookingId);


    try {
      if (typeof window !== 'undefined') {
        const existing = localStorage.getItem('pendingPayment');
        if (!existing) {
          localStorage.setItem('pendingBooking', JSON.stringify({ bookingId }));
        }
      }
    } catch (e) {
      console.warn('No se pudo setear pendingBooking', e);
    }

    setShowPayment(true);
  };

  const formattedPrice = lodging ? new Intl.NumberFormat('es-CO').format(Number(lodging.pricePerNight)) : '0';
  const { city, address, coordinates } = lodging?.location || {};
  const amenities = lodging?.amenities || [];

  const capacity = lodging?.capacity ?? 1;
  const rooms = lodging?.rooms ?? 1;
  const beds = lodging?.beds ?? 1;
  const baths = lodging?.baths ?? 1;

  const mainImage = lodging?.images?.[0] ?? '';

  return {
    lodging,
    loading,
    error,

    showBooking,
    setShowBooking,
    showPayment,
    setShowPayment,
    pendingBookingId,
    setPendingBookingId,
    navigating,

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
  };
}
    