
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';


type Tab = 'signup' | 'login' | '2fa';

export function useHostAuthModal(open: boolean, onClose: () => void, setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>, setUserName: React.Dispatch<React.SetStateAction<string | null>>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerUser, loginUser, verifyTwoFactor, loading } = useAuth();

  const [tab, setTab] = useState<Tab>('signup');
  const [name, setName] = useState('');
  const [emailS, setEmailS] = useState('');
  const [passS, setPassS] = useState('');
  const [emailL, setEmailL] = useState('');
  const [passL, setPassL] = useState('');
  const [err, setErr] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [is2FARequired, setIs2FARequired] = useState(false);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const qTab = (searchParams.get('tab') as Tab) || 'signup';
      setTab(qTab);
    }
  }, [open, searchParams]);

  const resetState = () => {
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

    const keys = [
      'twoFactorRequired',
      'qrCodeUrl',
      'twoFactorEnabled',
      'twoFactorSecret',
      'twoFactorTempToken',
      'twoFactorCode',
      'signupRole',
    ];
    keys.forEach(k => localStorage.removeItem(k));
  };

  const parseJwt = (token?: string | null) => {
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
    } catch {
      return null;
    }
  };

  const normalizeRolesFromResult = (result: any): string[] => {
    let raw = result?.roles ?? result?.user?.roles ?? result?.payload?.roles ?? result?.data?.roles ?? [];
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      const looksJsonArray = trimmed.startsWith('[') && trimmed.endsWith(']');
      if (looksJsonArray) {
        try { raw = JSON.parse(trimmed); } catch { raw = trimmed.split(',').map(s => s.trim()); }
      } else { raw = trimmed.split(',').map(s => s.trim()); }
    }
    const arr = Array.isArray(raw) ? raw : [raw];
    return Array.from(new Set(arr.map(String).map(s => s.trim().toLowerCase()).filter(Boolean)));
  };

  const extractAuthInfo = (result: any) => {
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
    for (const c of idCandidates) if (c && String(c).trim()) { id = String(c).trim(); break; }
    if (!id && token) {
      const payload = parseJwt(token);
      if (payload) id = payload.sub ?? payload.id ?? payload.userId ?? null;
    }
    const roles = normalizeRolesFromResult(result);
    const userData = userCandidate ?? null;
    return { id, token, name, userData, roles };
  };

  const redirectAfterAuth = () => {
    const redirect = localStorage.getItem('postLoginRedirect');
    if (redirect) { localStorage.removeItem('postLoginRedirect'); router.push(redirect); }
    else router.push('/');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (name.trim().length < 3) return setErr('El nombre debe tener al menos 3 caracteres');
    if (passS.length < 10) return setErr('La contraseña debe tener al menos 10 caracteres');

    try {
      const selectedRole = localStorage.getItem('signupRole') || 'guest';
      const res = await registerUser(emailS, passS, { name, roles: [selectedRole] });
      const info = extractAuthInfo(res);

      if (info.id) localStorage.setItem('userId', info.id);
      if (info.userData) localStorage.setItem('userData', JSON.stringify(info.userData));
      if (Array.isArray(info.roles) && info.roles.length) {
        localStorage.setItem('roles', JSON.stringify(info.roles));
        if (!localStorage.getItem('activeRole')) {
          localStorage.setItem('activeRole', info.roles[0]);
          localStorage.setItem('viewAs', info.roles[0]);
          window.dispatchEvent(new CustomEvent('role:changed', { detail: { activeRole: info.roles[0] } }));
        } else window.dispatchEvent(new Event('auth:updated'));
      }

      if (res) {
        setTab('login');
        setEmailL(emailS);
        setPassL(passS);
      } else setErr('Usuario ya existe');
    } catch (error: any) {
      if (error?.response?.status === 409) setErr('El usuario ya está registrado. Intenta iniciar sesión.');
      else setErr('Error al registrar el usuario');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      const result = await loginUser(emailL, passL);

      if (result?.twoFactorRequired) {
        localStorage.setItem('twoFactorRequired', 'true');
        if (result.qrCodeUrl) { localStorage.setItem('qrCodeUrl', result.qrCodeUrl); setQrCodeUrl(result.qrCodeUrl); }
        else { localStorage.removeItem('qrCodeUrl'); setQrCodeUrl(null); }
        setIs2FARequired(true);
        setTab('2fa');
        return;
      }

      const info = extractAuthInfo(result);
      if (info.token && info.name) {
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
          } else window.dispatchEvent(new Event('auth:updated'));
        } else window.dispatchEvent(new Event('auth:updated'));
        localStorage.removeItem('twoFactorRequired');
        localStorage.removeItem('qrCodeUrl');
        localStorage.removeItem('signupRole');

        setIsAuthenticated(true);
        setUserName(info.name);
        onClose();
        redirectAfterAuth();
        return;
      }

      setErr('Error en los datos de login');
    } catch (error: any) {
      if (error?.response?.status === 401) setErr('Credenciales incorrectas. Verifica correo y contraseña.');
      else setErr('Error al iniciar sesión');
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!twoFactorCode.trim()) return setErr('Por favor, ingresa el código 2FA');

    try {
      const result = await verifyTwoFactor(emailL, passL, twoFactorCode);
      const info = extractAuthInfo(result);

      if (info.token && info.name) {
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
          } else window.dispatchEvent(new Event('auth:updated'));
        } else window.dispatchEvent(new Event('auth:updated'));

        const keys = [
          'twoFactorRequired',
          'qrCodeUrl',
          'twoFactorEnabled',
          'twoFactorSecret',
          'twoFactorTempToken',
          'twoFactorCode',
          'signupRole',
        ];
        keys.forEach(k => localStorage.removeItem(k));

        setIsAuthenticated(true);
        setUserName(info.name);
        onClose();
        redirectAfterAuth();
      } else setErr('Código 2FA inválido. Verifica e intenta de nuevo.');
    } catch (error: any) {
      setErr('Error al verificar el código. Intenta de nuevo.');
    }
  };

  return {
    tab, setTab,
    name, setName,
    emailS, setEmailS,
    passS, setPassS,
    emailL, setEmailL,
    passL, setPassL,
    twoFactorCode, setTwoFactorCode,
    qrCodeUrl,
    is2FARequired,
    err, loading,
    handleSignup, handleLoginSubmit, handle2FASubmit
  };
}
