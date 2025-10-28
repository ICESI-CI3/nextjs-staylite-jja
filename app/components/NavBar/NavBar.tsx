'use client';

import 'font-awesome/css/font-awesome.min.css';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import HostAuthModal from '@/app/components/auth/HostAuthModal';
import Button from './../Button';
import { SearchBar } from './SearchBar';
import type { OnSearchFn } from '../types/search';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export const Navbar = ({ onSearch }: { onSearch: OnSearchFn }) => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signup' | 'login'>('signup');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [modalKey, setModalKey] = useState(0);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isListing = pathname?.startsWith('/listing/');

  const readRoles = (): string[] => {
  const norm = (arr: any): string[] =>
    (Array.isArray(arr) ? arr : [arr])
      .filter((v) => v !== null && v !== undefined)
      .map(String)
      .flatMap((s) => s.includes(',') ? s.split(',') : [s]) // soporta "host,admin"
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

  const tryParse = (raw: string | null): any => {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return raw; }
  };

  let v = tryParse(localStorage.getItem('roles'));

  // si tras el primer parse sigue siendo string con pinta de JSON, intenta parsear de nuevo
  if (typeof v === 'string') {
    const looksJsonArray = v.startsWith('[') && v.endsWith(']');
    if (looksJsonArray) {
      try { v = JSON.parse(v); } catch { /* queda como string */ }
    }
  }

  // fallback a userData.roles si roles no existe
  if (!v || (Array.isArray(v) && v.length === 0)) {
    const ud = tryParse(localStorage.getItem('userData'));
    if (ud?.roles) v = ud.roles;
  }

  // normaliza
  const normalized = norm(v ?? []);
  return Array.from(new Set(normalized));
};

  // 🔹 Cargar sesión al montar
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const name = localStorage.getItem('userName');
    setRoles(readRoles());
    if (token && name) {
      setIsAuthenticated(true);
      setUserName(name);
    } else {
      setIsAuthenticated(false);
      setUserName(null);
    }
  }, []);

  // 🔹 Escuchar cambios desde otros tabs o eventos del modal
  useEffect(() => {
    const updateRoles = () => setRoles(readRoles());
    window.addEventListener('auth:updated', updateRoles);
    window.addEventListener('storage', updateRoles);
    return () => {
      window.removeEventListener('auth:updated', updateRoles);
      window.removeEventListener('storage', updateRoles);
    };
  }, []);

  // 🔹 Refrescar roles cuando cambia autenticación
  useEffect(() => {
    setRoles(readRoles());
  }, [isAuthenticated]);


  useEffect(() => {
  const rereadSession = () => {
    setRoles(readRoles());
    const token = localStorage.getItem('authToken');
    const name = localStorage.getItem('userName');
    setIsAuthenticated(Boolean(token && name));
    setUserName(name);
  };

  window.addEventListener('auth:updated', rereadSession);
  window.addEventListener('storage', rereadSession);

  return () => {
    window.removeEventListener('auth:updated', rereadSession);
    window.removeEventListener('storage', rereadSession);
  };
}, []);

useEffect(() => {
  console.log('Navbar -> isAuthenticated:', isAuthenticated, 'roles:', roles);
}, [isAuthenticated, roles]);


  useEffect(() => {
    const shouldOpen = searchParams.get('authOpen') === '1';
    const tab = (searchParams.get('tab') as 'signup' | 'login') || 'signup';
    if (shouldOpen) {
      setAuthTab(tab);
      setAuthOpen(true);
    }
  }, [searchParams]);

  // ⚙️ Acciones principales
  const handleGoProfile = () => {
    if (!isAuthenticated) {
      setAuthTab('login');
      setAuthOpen(true);
      return;
    }
    router.push('/profile');
  };

  const handleCreateListing = () => {
    if (!isAuthenticated) {
      localStorage.setItem('signupRole', 'host');
      setAuthTab('signup');
      setAuthOpen(true);
      return;
    }
    router.push('/listing/new');
  };

  const goToBecomeHost = () => {
    localStorage.setItem('signupRole', 'host');
    setAuthTab('signup');
    setAuthOpen(true);
  };

  const goToProfileOrLogin = () => {
    setAuthTab('login');
    setAuthOpen(true);
  };

  const handleLogout = () => {
    const keys = [
      'authToken',
      'userName',
      'userData',
      'roles',
      'twoFactorRequired',
      'qrCodeUrl',
      'twoFactorEnabled',
      'twoFactorSecret',
      'twoFactorTempToken',
      'twoFactorCode',
      'postLoginRedirect',
      'signupRole',
    ];
    keys.forEach((k) => localStorage.removeItem(k));
    try {
      sessionStorage.clear();
    } catch {}

    setIsAuthenticated(false);
    setUserName(null);
    setRoles([]);
    setAuthOpen(false);
    setAuthTab('signup');
    setModalKey((k) => k + 1);
    router.push('/');
    router.refresh();
  };

  // 🎭 Roles disponibles
  const roleSet = new Set(roles.map((r) => r.toLowerCase()));
  const isHost = roleSet.has('host');
  const isAdmin = roleSet.has('admin');

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
          {[
            { src: '/alojamiento.png', label: 'Alojamientos' },
            { src: '/experiencias.png', label: 'Experiencias' },
            { src: '/servicio.png', label: 'Buen servicio' },
          ].map((item) => (
            <div key={item.label} className="text-white text-center">
              <div className="flex justify-center items-center space-x-2">
                <img src={item.src} alt={item.label} className="w-6 h-6" />
                <span>{item.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleGoProfile}
            className="py-2 px-4 text-sm bg-white text-blue-700 rounded-full hover:bg-gray-200 transition"
          >
            Ir al perfil
          </button>

          {isAuthenticated && (isHost || isAdmin) && (
            <button
              type="button"
              onClick={handleCreateListing}
              className="py-2 px-4 text-sm bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition"
            >
              Crear listing
            </button>
          )}

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
            <div className="flex items-center space-x-3">
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

      {!isListing && (
        <div className="bg-blue-600 w-full flex justify-center -mt-10 md:-mt-12 pb-6">
          <SearchBar onSearch={onSearch} />
        </div>
      )}

      <HostAuthModal
        key={modalKey}
        open={authOpen}
        onClose={() => {
          setAuthOpen(false);
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('authOpen');
            url.searchParams.delete('tab');
            router.replace(url.pathname + url.search);
          }
          setRoles(readRoles());
        }}
        setIsAuthenticated={setIsAuthenticated}
        setUserName={setUserName}
      />
    </>
  );
};
