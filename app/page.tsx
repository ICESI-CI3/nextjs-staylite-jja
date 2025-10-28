'use client';

import React, { useState, useEffect } from 'react';
import ListingCard from './components/Listing/ListingCard';
import { useRouter } from 'next/navigation';
import { Navbar } from './components/NavBar/NavBar';
import type { OnSearchFn } from './components/types/search';

const HomePage = () => {
  const [lodgings, setLodgings] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchLodgings = async () => {
      try {
        const response = await fetch('http://localhost:3000/lodgings');
        const data = await response.json();

        const active = Array.isArray(data)
          ? data.filter((l) => l?.isActive === true || (l?.isActive ?? true))
          : [];

        setLodgings(active);
        setSearchResults(active);
      } catch (error) {
        console.error('Error fetching lodgings:', error);
      }
    };
    fetchLodgings();
  }, []);

  const handleSearch: OnSearchFn = (
    destination,
    _checkIn,
    _checkOut,
    guests,
    _address,
    amenities,
    pricePerNight
  ) => {
    let results = [...lodgings];

    if (destination?.trim()) {
      const q = destination.toLowerCase();
      results = results.filter((l) =>
        l?.location?.city?.toLowerCase().includes(q) ||
        l?.location?.country?.toLowerCase().includes(q) ||
        l?.title?.toLowerCase().includes(q) ||
        l?.location?.address?.toLowerCase().includes(q)
      );
    }

    if (guests && Number.isFinite(guests)) {
      results = results.filter((l) => {
        const capacity = l?.capacity ?? l?.maxGuests ?? l?.guests ?? 0;
        return Number(capacity) >= Number(guests);
      });
    }

    if (amenities?.trim()) {
      const requested = amenities
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      if (requested.length > 0) {
        results = results.filter((l) => {
          const a: string[] = (l?.amenities ?? []).map((x: string) => (x ?? '').toLowerCase());
          return requested.every((req) => a.some((am) => am.includes(req)));
        });
      }
    }

    if (Number.isFinite(pricePerNight) && pricePerNight > 0) {
      results = results.filter((l) => Number(l?.pricePerNight) <= Number(pricePerNight));
    }

    setSearchResults(results);
  };

  return (
    <div>
      <Navbar onSearch={handleSearch} />

      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-6">Alojamientos populares</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {searchResults.length > 0 ? (
            searchResults.map((lodging) => (
              <ListingCard
                key={lodging.id}
                title={lodging.title}
                location={lodging.location?.city}
                pricePerNight={lodging.pricePerNight}
                images={lodging.images}
                id={lodging.id}
                onAction={() => router.push(`/listing/${lodging.id}`)}
              />
            ))
          ) : (
            <p className="col-span-full text-center">No se encontraron resultados para la búsqueda.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
