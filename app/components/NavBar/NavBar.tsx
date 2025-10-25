'use client';

import 'font-awesome/css/font-awesome.min.css';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HostAuthModal from '@/app/components/auth/HostAuthModal';
import Button from './../Button';

export const Navbar = ({
  onSearch,
}: {
  onSearch: (
    destination: string,
    checkIn: string,
    checkOut: string,
    guests: number
  ) => void;
}) => {
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signup' | 'login'>('signup');

  const router = useRouter();

  const handleSearch = () => {
    onSearch(destination, checkIn, checkOut, guests);
    router.push('/search-results');
  };

  const goToBecomeHost = () => {
    setAuthTab('signup');
    setAuthOpen(true);
  };

  const goToProfileOrLogin = () => {
    setAuthTab('login');
    setAuthOpen(true);
  };

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);  

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const name = localStorage.getItem('userName');

    if (token && name) {
      setIsAuthenticated(true); 
      setUserName(name); 
    } else {
      setIsAuthenticated(false);
      setUserName(null);
    }
  }, []); 

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    
    setIsAuthenticated(false);
    setUserName(null); 
  };

  return (
    <>
      <nav className="bg-blue-600 w-full flex justify-between items-center mx-auto px-8 h-20">
        <div className="inline-flex">
          <Link href="/" className="hidden md:block">
            <img src="/logo.png" alt="Staylite Logo" className="w-20 h-auto" />
          </Link>
        </div>

        <div className="hidden sm:block flex-shrink flex-grow-0 justify-start px-2">
          <div className="inline-block">
            <div className="inline-flex items-center max-w-full">
              <button
                type="button"
                onClick={handleSearch}
                className="flex items-center flex-grow-0 flex-shrink pl-2 relative w-60 border rounded-full px-1 py-1 bg-white text-gray-600 shadow-lg"
                aria-label="Buscar"
              >
                <div className="block flex-grow flex-shrink overflow-hidden">
                  Comienza tu búsqueda
                </div>
                <div className="flex items-center justify-center relative h-8 w-8 rounded-full bg-blue-600 text-white">
                  <i className="fa fa-search text-[13px]" />
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-initial flex justify-end items-center relative space-x-4">
          {!isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={goToBecomeHost}
                className="py-2 px-4 text-white rounded-full hover:bg-blue-500 transition"
              >
                Convertirse en anfitrión
              </button>
              <button
                type="button"
                onClick={goToProfileOrLogin}
                className="py-2 px-3 bg-white text-blue-600 rounded-full shadow-md hover:bg-gray-200 transition"
                aria-label="Perfil / Iniciar sesión"
              >
                <i className="fa fa-user text-[18px]" />
              </button>
            </>
          ) : (
            
           <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-smile text-black text-xl"></i> 
              <span className="text-white font-semibold text-lg bg-white-600 py-1 px-3 rounded-md shadow-md">
                Hola, <span className="text-xl font-bold">{userName}</span>
              </span>
            </div>
            <Button
              label="Cerrar sesión"
              onClick={handleLogout}
              className="bg-red-600 text-white py-2 px-5 rounded-lg shadow-xl hover:bg-red-700 transition-all duration-300"
            />
          </div>

          )}
        </div>
      </nav>

      <HostAuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        setIsAuthenticated={setIsAuthenticated} 
        setUserName={setUserName}  
      />
    </>
  );
};
