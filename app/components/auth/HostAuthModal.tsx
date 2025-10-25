'use client';

import React, { useState } from 'react';
import Modal from './Modal';
import { useAuth } from '@/app/hooks/useAuth';

type Tab = 'signup' | 'login' | '2fa';

interface HostAuthModalProps {
  open: boolean;
  onClose: () => void;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  setUserName: React.Dispatch<React.SetStateAction<string | null>>;
}

const HostAuthModal: React.FC<HostAuthModalProps> = ({ open, onClose, setIsAuthenticated, setUserName }) => {
  const { registerUser, loginUser, verifyTwoFactor, loading, error, token } = useAuth();
  const [tab, setTab] = useState<Tab>('signup');
  const [name, setName] = useState('');
  const [emailS, setEmailS] = useState('');
  const [passS, setPassS] = useState('');
  const [emailL, setEmailL] = useState('');
  const [passL, setPassL] = useState('');
  const [err, setErr] = useState<string>('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [is2FARequired, setIs2FARequired] = useState<boolean>(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (name.length < 3) {
      setErr('El nombre debe tener al menos 3 caracteres');
      return;
    }
    if (passS.length < 10) {
      setErr('La contraseña debe tener al menos 10 caracteres');
      return;
    }

    try {
      const res = await registerUser(emailS, passS, { name, roles: ['guest', 'host'] });
      if (res) {
        setTab('login');
      }
    } catch (e) {
      setErr('Error al registrar el usuario');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      const result = await loginUser(emailL, passL);

      if (result?.twoFactorRequired) {
        setQrCodeUrl(result.qrCodeUrl);
        console.log('QR Code URL:', result.qrCodeUrl);
        setIs2FARequired(true);
        setTab('2fa');
      } else {
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('userName', result.name);
        console.log('Logged in user name:', result.name);
        setIsAuthenticated(true);
        setUserName(result.name);
        onClose();
      }
    } catch (e) {
      setErr('Credenciales inválidas');
    }
  };


  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');

    console.log('twoFactorCode submitted:', twoFactorCode);

    try {
      if (!twoFactorCode) {
        setErr('Por favor, ingresa el código 2FA');
        return;
      }


      const result = await verifyTwoFactor(emailL, passL, twoFactorCode);

      localStorage.setItem('authToken', result.token);
      localStorage.setItem('userName', result.name);
      setIsAuthenticated(true);
      setUserName(result.name);
      onClose();
    } catch (e) {
      setErr('Código 2FA inválido');
    }
  };


  return (
    <Modal open={open} onClose={onClose} widthClass="max-w-lg">
      <div className="flex items-center justify-between px-6 pt-5">
        <h2 className="text-xl font-semibold">
          {tab === 'signup' ? 'Crea tu cuenta de anfitrión' : tab === 'login' ? 'Inicia sesión' : 'Verificación 2FA'}
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
              <button
                type="button"
                onClick={() => setTab('login')}
                className="text-blue-600 hover:underline"
              >
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
              <button
                type="button"
                onClick={() => setTab('signup')}
                className="text-blue-600 hover:underline"
              >
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
