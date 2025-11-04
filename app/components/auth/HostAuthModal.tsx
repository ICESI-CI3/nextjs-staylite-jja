'use client';

import React from 'react';
import Modal from './Modal';
import { useHostAuthModal } from '@/app/hooks/useHostAuthModal';

interface HostAuthModalProps {
  open: boolean;
  onClose: () => void;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  setUserName: React.Dispatch<React.SetStateAction<string | null>>; // <-- CORRECIÓN
}

export const HostAuthModal: React.FC<HostAuthModalProps> = ({
  open,
  onClose,
  setIsAuthenticated,
  setUserName, // ahora tipado correctamente
}) => {
  const {
    tab, setTab,
    name, setName,
    emailS, setEmailS,
    passS, setPassS,
    emailL, setEmailL,
    passL, setPassL,
    twoFactorCode, setTwoFactorCode,
    qrCodeUrl,
    err, loading,
    handleSignup, handleLoginSubmit, handle2FASubmit
  } = useHostAuthModal(open, onClose, setIsAuthenticated, setUserName);

  return (
    <Modal open={open} onClose={onClose} widthClass="max-w-lg">
      <div className="flex items-center justify-between px-6 pt-5">
        <h2 className="text-xl font-semibold">
          {tab === 'signup' ? 'Crea tu cuenta' : tab === 'login' ? 'Inicia sesión' : 'Verificación 2FA'}
        </h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">✕</button>
      </div>

      <div className="px-6 pb-6 pt-4">
        {tab === 'signup' ? (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-sm text-gray-700">Nombre</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={name} onChange={(e) => setName(e.target.value)} required
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Correo</label>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={emailS} onChange={(e) => setEmailS(e.target.value)} required
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Contraseña</label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={passS} onChange={(e) => setPassS(e.target.value)} minLength={10} required
              />
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
            >
              {loading ? 'Creando...' : 'Crear cuenta'}
            </button>

            <p className="text-sm text-gray-600 text-center">
              ¿Ya tienes cuenta?{' '}
              <button type="button" onClick={() => setTab('login')} className="text-blue-600 hover:underline">
                Inicia sesión
              </button>
            </p>
          </form>
        ) : tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-700">Correo</label>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={emailL} onChange={(e) => setEmailL(e.target.value)} required
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Contraseña</label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={passL} onChange={(e) => setPassL(e.target.value)} required
              />
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
            >
              Iniciar sesión
            </button>

            <p className="text-sm text-gray-600 text-center">
              ¿No tienes cuenta?{' '}
              <button type="button" onClick={() => setTab('signup')} className="text-blue-600 hover:underline">
                Crea una
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handle2FASubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-700">Código 2FA</label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} required
              />
            </div>

            {qrCodeUrl && (
              <div className="mt-4">
                <label className="text-sm text-gray-700">
                  Escanea este código QR con tu aplicación de autenticación
                </label>
                <img src={qrCodeUrl} alt="QR Code" className="mt-2 w-full max-w-xs mx-auto" />
              </div>
            )}

            {err && <p className="text-sm text-red-600">{err}</p>}

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
            >
              Verificar código
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default HostAuthModal;
