'use client';

import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';

type Tab = 'signup' | 'login' | '2fa';

interface HostAuthModalProps {
  open: boolean;
  onClose: () => void;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  setUserName: React.Dispatch<React.SetStateAction<string | null>>;
}

const HostAuthModal: React.FC<HostAuthModalProps> = ({
  open,
  onClose,
  setIsAuthenticated,
  setUserName,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerUser, loginUser, verifyTwoFactor, loading } = useAuth();

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

  useEffect(() => {
    if (!open) {
      setTab('signup');
      setName('');
      setEmailS('');
      setPassS('');
      setEmailL('');
      setPassL('');
      setErr('');
      setTwoFactorCode('');
      setQrCodeUrl(null);
      setIs2FARequired(false);

      const twoFaKeys = [
        'twoFactorRequired',
        'qrCodeUrl',
        'twoFactorEnabled',
        'twoFactorSecret',
        'twoFactorTempToken',
        'twoFactorCode',
      ];
      twoFaKeys.forEach((k) => localStorage.removeItem(k));
    }
  }, [open]);

  function parseJwt(token?: string | null) {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(payload)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  // helper: normalizar roles del resultado de la API
  function normalizeRolesFromResult(result: any): string[] {
    let raw = result?.roles ?? result?.user?.roles ?? result?.payload?.roles ?? result?.data?.roles ?? [];

    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      const looksJsonArray = trimmed.startsWith('[') && trimmed.endsWith(']');
      if (looksJsonArray) {
        try {
          raw = JSON.parse(trimmed);
        } catch {
          raw = trimmed.split(',').map((s: string) => s.trim());
        }
      } else {
        raw = trimmed.split(',').map((s: string) => s.trim());
      }
    }

    const arr = Array.isArray(raw) ? raw : [raw];
    return Array.from(
      new Set(arr.map(String).map((s) => s.trim().toLowerCase()).filter(Boolean))
    );
  }

  // helper: extrae userId, token, name, userData y roles de varias formas de respuesta
  function extractAuthInfo(result: any) {
    if (!result) return { id: null, token: null, name: null, userData: null, roles: [] };

    const token = result?.token ?? result?.accessToken ?? result?.data?.token ?? null;
    const name = result?.name ?? result?.user?.name ?? result?.data?.name ?? null;

    const userCandidate = result?.user ?? result?.data?.user ?? result?.data ?? result;

    const idCandidates = [
      userCandidate?.id,
      userCandidate?._id,
      userCandidate?.userId,
      result?.id,
      result?._id,
      result?.userId,
      result?.payload?.sub,
    ];

    let id: string | null = null;
    for (const c of idCandidates) {
      if (c && String(c).trim()) {
        id = String(c).trim();
        break;
      }
    }

    if (!id && token) {
      const payload = parseJwt(token);
      if (payload) {
        if (payload.sub) id = String(payload.sub);
        else if (payload.id) id = String(payload.id);
        else if (payload.userId) id = String(payload.userId);
      }
    }

    // Si aún no hay id, intentar buscar primer string parecido dentro de userCandidate
    if (!id && userCandidate && typeof userCandidate === 'object') {
      for (const k of Object.keys(userCandidate)) {
        const v = userCandidate[k];
        if (typeof v === 'string' && v.length >= 6 && /^[a-z0-9-_.]+$/i.test(v)) {
          id = v;
          break;
        }
      }
    }

    const roles = normalizeRolesFromResult(result);
    const userData = userCandidate ?? null;

    return { id, token, name, userData, roles };
  }
  // ---------- end helpers ----------

  useEffect(() => {
    if (open) {
      const qTab = (searchParams.get('tab') as Tab) || 'signup';
      setTab(qTab);
    }
  }, [open, searchParams]);

  const redirectAfterAuth = () => {
    const redirect = localStorage.getItem('postLoginRedirect');
    if (redirect) {
      localStorage.removeItem('postLoginRedirect');
      router.push(redirect);
    } else {
      router.push('/');
    }
  };

  // Registro
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');

    if (name.trim().length < 3) {
      setErr('El nombre debe tener al menos 3 caracteres');
      return;
    }
    if (passS.length < 10) {
      setErr('La contraseña debe tener al menos 10 caracteres');
      return;
    }

    try {
      const selectedRole = localStorage.getItem('signupRole') || 'guest';
      const res = await registerUser(emailS, passS, { name, roles: [selectedRole] });

      // extraer info y guardarla si viene
      const info = extractAuthInfo(res);
      try {
        if (info.id) localStorage.setItem('userId', info.id);
        if (info.userData) localStorage.setItem('userData', JSON.stringify(info.userData));
        if (Array.isArray(info.roles) && info.roles.length) {
          localStorage.setItem('roles', JSON.stringify(info.roles));
          // si no hay activeRole guardada, poner la primera role como active por defecto
          if (!localStorage.getItem('activeRole')) {
            localStorage.setItem('activeRole', info.roles[0]);
            localStorage.setItem('viewAs', info.roles[0]);
            window.dispatchEvent(new CustomEvent('role:changed', { detail: { activeRole: info.roles[0] } }));
          } else {
            // emitir role:changed para que otros componentes reevalúen
            window.dispatchEvent(new Event('auth:updated'));
          }
        }
      } catch (e) {
        console.warn('HostAuthModal: fallo al guardar userData en localStorage', e);
      }

      if (res) {
        setTab('login');
        setEmailL(emailS);
        setPassL(passS);
      } else {
        setErr('No se pudo registrar el usuario');
      }
    } catch (error: any) {
      if (error?.response?.status === 409) {
        setErr('El usuario ya está registrado. Intenta iniciar sesión.');
      } else {
        setErr('Error al registrar el usuario');
      }
    }
  };

  // Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      const result = await loginUser(emailL, passL);

      if (result?.twoFactorRequired) {
        localStorage.setItem('twoFactorRequired', 'true');
        if (result.qrCodeUrl) {
          localStorage.setItem('qrCodeUrl', result.qrCodeUrl);
          setQrCodeUrl(result.qrCodeUrl);
        } else {
          localStorage.removeItem('qrCodeUrl');
          setQrCodeUrl(null);
        }
        setIs2FARequired(true);
        setTab('2fa');
        return;
      }

      const info = extractAuthInfo(result);

      if (info.token && info.name) {
        try {
          localStorage.setItem('authToken', info.token);
          localStorage.setItem('userName', info.name);

          if (info.id) localStorage.setItem('userId', info.id);
          if (info.userData) localStorage.setItem('userData', JSON.stringify(info.userData));
          if (Array.isArray(info.roles) && info.roles.length) {
            localStorage.setItem('roles', JSON.stringify(info.roles));
            if (!localStorage.getItem('activeRole')) {
              localStorage.setItem('activeRole', info.roles[0]);
              localStorage.setItem('viewAs', info.roles[0]);
              window.dispatchEvent(new CustomEvent('role:changed', { detail: { activeRole: info.roles[0] } }));
            } else {
              window.dispatchEvent(new Event('auth:updated'));
            }
          } else {
            window.dispatchEvent(new Event('auth:updated'));
          }
        } catch (e) {
          console.warn('HostAuthModal: fallo al guardar auth info en localStorage', e);
        }

        localStorage.removeItem('twoFactorRequired');
        localStorage.removeItem('qrCodeUrl');
        localStorage.removeItem('signupRole');

        setIsAuthenticated(true);
        setUserName(info.name);
        onClose();

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:updated'));
        }

        redirectAfterAuth();
        return;
      }

      setErr('Respuesta inesperada del servidor');
    } catch (error: any) {
      if (error?.response?.status === 401) {
        setErr('Credenciales incorrectas. Por favor, verifica tu correo y contraseña.');
      } else {
        setErr('Error al iniciar sesión');
      }
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');

    if (!twoFactorCode.trim()) {
      setErr('Por favor, ingresa el código 2FA');
      return;
    }

    try {
      const result = await verifyTwoFactor(emailL, passL, twoFactorCode);

      const info = extractAuthInfo(result);

      if (info.token && info.name) {
        try {
          localStorage.setItem('authToken', info.token);
          localStorage.setItem('userName', info.name);

          if (info.id) localStorage.setItem('userId', info.id);
          if (info.userData) localStorage.setItem('userData', JSON.stringify(info.userData));
          if (Array.isArray(info.roles) && info.roles.length) {
            localStorage.setItem('roles', JSON.stringify(info.roles));
            if (!localStorage.getItem('activeRole')) {
              localStorage.setItem('activeRole', info.roles[0]);
              localStorage.setItem('viewAs', info.roles[0]);
              window.dispatchEvent(new CustomEvent('role:changed', { detail: { activeRole: info.roles[0] } }));
            } else {
              window.dispatchEvent(new Event('auth:updated'));
            }
          } else {
            window.dispatchEvent(new Event('auth:updated'));
          }
        } catch (e) {
          console.warn('HostAuthModal: fallo al guardar auth info 2FA', e);
        }

        const twoFaKeys = [
          'twoFactorRequired',
          'qrCodeUrl',
          'twoFactorEnabled',
          'twoFactorSecret',
          'twoFactorTempToken',
          'twoFactorCode',
        ];
        twoFaKeys.forEach((k) => localStorage.removeItem(k));
        localStorage.removeItem('signupRole');

        setIsAuthenticated(true);
        setUserName(info.name);
        onClose();

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:updated'));
        }

        redirectAfterAuth();
      } else {
        setErr('Respuesta inesperada al verificar 2FA');
      }
    } catch (error: any) {
      setErr('Código 2FA inválido');
    }
  };

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
