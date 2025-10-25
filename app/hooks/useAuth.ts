import { useState } from 'react';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<'signup' | 'login' | '2fa'>('signup');
  const [emailL, setEmailL] = useState('');
  const [passL, setPassL] = useState('');
  const [emailS, setEmailS] = useState('');
  const [passS, setPassS] = useState('');
  const [name, setName] = useState('');

  const registerUser = async (email: string, password: string, userData: { name: string, roles: string[] }) => {
    setLoading(true);
    try {
      const requestData = { email, password, ...userData };
      console.log('Sending data to register:', requestData);

      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.message || `Error ${response.status}`);
      }

      const data = await response.json();
      setToken(data.token);
      console.log('Registration successful:', data);
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error desconocido');
      }
      console.error('Error during registration:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (email: string, password: string) => {
    setLoading(true);
    try {
      const requestData = { email, password };
      console.log('Sending data to login:', requestData);

      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.message || 'Error al iniciar sesión');
      }

      const data = await response.json();
      setToken(data.token);
      console.log('Login successful:', data);

      return {
        ...data,
        twoFactorRequired: data.twoFactorRequired ?? false, 
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error desconocido');
      }
      console.error('Error during login:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const verifyTwoFactor = async (email: string, password: string, twoFactorCode: string) => {
    setLoading(true);
    console.log('Verifying 2FA with code:', twoFactorCode);

    try {
      const requestData = { email, password, token: twoFactorCode };
      const response = await fetch('http://localhost:3000/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      console.log('Request data sent for 2FA verification:', requestData);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.message || 'Error during 2FA verification');
      }

      const data = await response.json();
      setToken(data.token);
      console.log('2FA verification successful:', data);

      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error desconocido');
      }
      console.error('Error during 2FA verification:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };


  const logoutUser = () => {
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setTab('signup');
    setEmailL('');
    setPassL('');
    setEmailS('');
    setPassS('');
    setName('');
  };


  return {
    loading,
    error,
    token,
    registerUser,
    loginUser,
    verifyTwoFactor,
    logoutUser,
  };
};

