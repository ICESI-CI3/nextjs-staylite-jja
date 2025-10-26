'use client';

import 'font-awesome/css/font-awesome.min.css';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import HostAuthModal from '@/app/components/auth/HostAuthModal';
import Button from './../Button';
import { SearchBar } from './SearchBar';
import type { OnSearchFn } from '../types/search';
import { usePathname } from 'next/navigation';

export const Navbar = ({ onSearch }: { onSearch: OnSearchFn }) => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signup' | 'login'>('signup');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  const pathname = usePathname();
  const isListing = pathname?.startsWith('/listing/');

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

  const goToBecomeHost = () => {
    setAuthTab('signup');
    setAuthOpen(true);
  };

  const goToProfileOrLogin = () => {
    setAuthTab('login');
    setAuthOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    setUserName(null);
  };

  return (
    <>
      <nav
        className={`bg-blue-600 w-full flex justify-between items-center mx-auto px-8 transition-all duration-300 ${
          isListing ? 'py-2' : 'py-1'
        }`}
      >
        <div className="flex items-center">
          <Link href="/" className="block">
            <img
              src="/logo.png"
              alt="StayLite Logo"
              className={`w-30 h-auto object-contain transition-all ${
                isListing ? 'mt-0' : 'mt-2'
              }`}
            />
          </Link>
        </div>
     
        <div className="flex justify-center items-center space-x-8 ml-10 md:ml-30">
            <div className="text-white text-center">
              <div className="flex justify-center items-center space-x-2">
                <img src="/alojamiento.png" alt="Alojamiento" className="w-6 h-6" />
                <span>Alojamientos</span>
              </div>
            </div>
            <div className="text-white text-center">
              <div className="flex justify-center items-center space-x-2">
                <img src="/experiencias.png" alt="Experiencias" className="w-6 h-6" />
                <span>Experiencias</span>
              </div>
            </div>
            <div className="text-white text-center">
              <div className="flex justify-center items-center space-x-2">
                <img src="/servicio.png" alt="Servicio" className="w-6 h-6" />
                <span>Buen servicio</span>
              </div>
            </div>
          </div>
        

        {/* --- AUTH --- */}
        <div className="flex items-center space-x-4">
          {!isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={goToBecomeHost}
                className="py-2 px-4 text-sm bg-white text-black rounded-full hover:bg-gray-200 transition"
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
                <span className="text-white font-semibold text-lg py-1 px-3 rounded-md shadow-md">
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

      {/* --- SEARCHBAR (solo fuera de listings) --- */}
      {!isListing && (
        <div className="bg-blue-600 w-full flex justify-center -mt-10 md:-mt-12 pb-6">
          <SearchBar onSearch={onSearch} />
        </div>
      )}

      {/* --- MODAL --- */}
      <HostAuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        setIsAuthenticated={setIsAuthenticated}
        setUserName={setUserName}
      />
    </>
  );
};
