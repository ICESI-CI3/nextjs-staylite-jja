'use client';
import React, { useState, useEffect } from 'react';
import ListingCard from './components/Listing/ListingCard';
import { useRouter } from 'next/navigation';  
import { Navbar } from './components/NavBar/NavBar';

const HomePage = () => {
  const [lodgings, setLodgings] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const router = useRouter();  
  useEffect(() => {
    console.log('Fetching lodgings from API...');
    const fetchLodgings = async () => {
      try {
        const response = await fetch('http://localhost:3000/lodgings');
        const data = await response.json();
        setLodgings(data);
        console.log('Data fetched from API:', data);
        setSearchResults(data);
      } catch (error) {
        console.error('Error fetching lodgings:', error);
      }
    };
    fetchLodgings();
  }, []);

  const handleSearch = async (destination: string) => {
    if (destination) {
      const foundLodging = lodgings.filter((lodging) =>
        lodging.title.toLowerCase().includes(destination.toLowerCase())
      );
      setSearchResults(foundLodging);
    } else {
      setSearchResults(lodgings);
    }
  };

  const handleDetailsClick = (id: string) => {
    router.push(`/listing/${id}`);
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
                location={lodging.location.city}
                pricePerNight={lodging.pricePerNight}
                images={lodging.images}
                id={lodging.id}  
                onAction={() => handleDetailsClick(lodging.id)} 
              />
            ))
          ) : (
            <p>No se encontraron resultados para la búsqueda.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
