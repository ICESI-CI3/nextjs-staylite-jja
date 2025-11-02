'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ListingCard from './components/Listing/ListingCard';
import { useRouter } from 'next/navigation';
import { Navbar } from './components/NavBar/NavBar';
import type { OnSearchFn } from './components/types/search';

// ---------- Roles tipados y utilidades ----------
export const ROLES = ['host', 'guest', 'admin'] as const;
export type Role = (typeof ROLES)[number];

const isRole = (s: unknown): s is Role =>
  typeof s === 'string' && (ROLES as readonly string[]).includes(String(s).toLowerCase());

const normalizeRoles = (input: unknown): Role[] => {
  const arr = Array.isArray(input) ? input : [input];
  const roles = arr
    .filter((v): v is string | number => v != null)
    .map(String)
    .map((s) => s.trim().toLowerCase())
    .filter(isRole);
  return Array.from(new Set(roles));
};
// ------------------------------------------------

const LS = {
  ROLES: 'roles',
  ACTIVE_ROLE: 'activeRole', // preferida para la "vista activa"
  VIEW_AS: 'viewAs', // legacy / compat
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData', // { id, _id, ... }
  USER_ID: 'userId', // guardado explícitamente por HostAuthModal si está disponible
} as const;

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
  } catch {
    return null;
  }
}

function readRoles(): Role[] {
  try {
    const raw = localStorage.getItem(LS.ROLES);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return normalizeRoles(parsed);
  } catch {
    return [];
  }
}

function readActiveRole(): Role | null {
  try {
    const v = localStorage.getItem(LS.ACTIVE_ROLE);
    if (v && isRole(v)) return v as Role;
    const fallback = localStorage.getItem(LS.VIEW_AS);
    if (fallback && isRole(fallback)) return fallback as Role;
    return null;
  } catch {
    return null;
  }
}


function readUserId(): string | null {
  try {
    const direct = localStorage.getItem(LS.USER_ID);
    if (direct && String(direct).trim()) return String(direct).trim();

    const udRaw = localStorage.getItem(LS.USER_DATA);
    if (udRaw) {
      try {
        const ud = JSON.parse(udRaw);
        const candidates = [ud?.id, ud?._id, ud?.userId];
        for (const c of candidates) {
          if (c && String(c).trim()) return String(c).trim();
        }
        // buscar primer string parecido a id dentro de userData
        if (typeof ud === 'object') {
          for (const k of Object.keys(ud)) {
            const v = ud[k];
            if (typeof v === 'string' && v.length >= 6 && /^[a-z0-9-_.]+$/i.test(v)) {
              return v;
            }
            if (typeof v === 'object' && (v?.id || v?._id)) {
              return String(v.id ?? v._id);
            }
          }
        }
      } catch {
      }
    }

    // intentar payload del JWT
    const token = localStorage.getItem(LS.AUTH_TOKEN) || null;
    if (token) {
      const payload = parseJwt(token);
      if (payload) {
        if (payload.sub) return String(payload.sub);
        if (payload.id) return String(payload.id);
        if (payload.userId) return String(payload.userId);
      }
    }

    return null;
  } catch {
    return null;
  }
}

const HomePage = () => {
  const [lodgings, setLodgings] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isHostView, setIsHostView] = useState(false);
  const router = useRouter();

  const recomputeMode = useCallback(() => {
    const roles = readRoles();
    const active = readActiveRole();
    const hostPresent = roles.includes('host');
    const hostView = hostPresent && active === 'host';
    setIsHostView(hostView);

    // debug
    console.debug('[Home] recomputeMode -> roles:', roles, 'active:', active, 'isHostView:', hostView);
  }, []);

  useEffect(() => {
    recomputeMode();
    const onChange = () => recomputeMode();

    window.addEventListener('storage', onChange);
    window.addEventListener('role:changed', onChange as EventListener);
    window.addEventListener('view:changed', onChange as EventListener);
    window.addEventListener('auth:updated', onChange as EventListener);

    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener('role:changed', onChange as EventListener);
      window.removeEventListener('view:changed', onChange as EventListener);
      window.removeEventListener('auth:updated', onChange as EventListener);
    };
  }, [recomputeMode]);

  const fetchHostLodgingsFallback = async (hostId: string, token: string | null) => {
    const candidates = [
      `http://localhost:3000/lodgings/${hostId}/my-lodgings`,
      `http://localhost:3000/lodgings?ownerId=${hostId}`,
      `http://localhost:3000/lodgings?hostId=${hostId}`,
      `http://localhost:3000/users/${hostId}/lodgings`,
    ];

    for (const url of candidates) {
      try {
        const r = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!r.ok) {
          console.warn('[Home] candidate fetch failed', url, r.status);
          continue;
        }
        const data = await r.json();
        if (Array.isArray(data)) {
          console.debug('[Home] fetchHostLodgingsFallback success from', url);
          return data;
        }
      } catch (err) {
        console.warn('[Home] fetchHostLodgingsFallback error for', url, err);
        continue;
      }
    }

    // fallback final: descargar todo y filtrar por campos plausibles
    try {
      const r = await fetch('http://localhost:3000/lodgings');
      if (!r.ok) throw new Error('Fetch all lodgings failed');
      const all = await r.json();
      if (!Array.isArray(all)) return [];
      const plausibleFields = ['ownerId', 'hostId', 'userId', 'createdBy', 'owner'];
      const filtered = all.filter((item: any) => {
        for (const f of plausibleFields) {
          const v = item?.[f];
          if (!v) continue;
          if (String(v) === hostId) return true;
          if (typeof v === 'object' && (v.id === hostId || v._id === hostId)) return true;
        }
        return false;
      });
      console.debug('[Home] filtered by owner fields, count:', filtered.length);
      return filtered;
    } catch (err) {
      console.error('[Home] final fallback failed', err);
      return [];
    }
  };

  const fetchLodgings = useCallback(async () => {
    try {
      if (isHostView) {
        const hostId = readUserId();
        console.debug('[Home] isHostView true -> hostId:', hostId);
        if (!hostId) {
          setLodgings([]);
          setSearchResults([]);
          return;
        }
        const token = localStorage.getItem(LS.AUTH_TOKEN) || null;
        const list = await fetchHostLodgingsFallback(hostId, token);
        setLodgings(list);
        setSearchResults(list);
      } else {
        console.debug('[Home] guest/public view -> fetching public lodgings');
        const r = await fetch('http://localhost:3000/lodgings');
        if (!r.ok) throw new Error(`Fetch public lodgings failed: ${r.status}`);
        const data = await r.json();
        const active = Array.isArray(data)
          ? data.filter((l) => l?.isActive === true || (l?.isActive ?? true))
          : [];
        setLodgings(active);
        setSearchResults(active);
      }
    } catch (e) {
      console.error('[Home] fetchLodgings error', e);
      setLodgings([]);
      setSearchResults([]);
    }
  }, [isHostView]);

  useEffect(() => {
    fetchLodgings();
  }, [fetchLodgings, isHostView]);

  const handleSearch: OnSearchFn = (destination, _a, _b, guests, _addr, amenities, pricePerNight) => {
    let results = [...lodgings];

    if (destination?.trim()) {
      const q = destination.toLowerCase();
      results = results.filter((l) =>
        (l?.location?.city ?? '').toLowerCase().includes(q) ||
        (l?.location?.country ?? '').toLowerCase().includes(q) ||
        (l?.title ?? '').toLowerCase().includes(q) ||
        (l?.location?.address ?? '').toLowerCase().includes(q)
      );
    }

    if (guests && Number.isFinite(guests)) {
      results = results.filter(
        (l) => Number(l?.capacity ?? l?.maxGuests ?? l?.guests ?? 0) >= Number(guests)
      );
    }

    if (amenities?.trim()) {
      const reqs = amenities.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      if (reqs.length) {
        results = results.filter((l) => {
          const a: string[] = (l?.amenities ?? []).map((x: string) => (x ?? '').toLowerCase());
          return reqs.every((req) => a.some(am => am.includes(req)));
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
        <h2 className="text-2xl font-semibold mb-6">
          {isHostView ? 'Mis alojamientos' : 'Alojamientos populares'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {searchResults.length > 0 ? (
            // ejemplo dentro de tu map
            searchResults.map((lodging) => (
              <ListingCard
                key={lodging.id ?? lodging._id}
                title={lodging.title}
                location={lodging.location?.city}
                pricePerNight={lodging.pricePerNight}
                images={lodging.images}
                id={lodging.id ?? lodging._id}
                ownerId={
                  lodging.ownerId ??
                  lodging.hostId ??
                  lodging.owner?.id ??
                  lodging.owner?._id ??
                  lodging.createdBy ??
                  lodging.userId ??
                  null
                }
                onAction={() => router.push(`/listing/${lodging.id ?? lodging._id}`)}
              />
            ))

          ) : (
            <p className="col-span-full text-center">
              {isHostView ? 'No tienes alojamientos creados todavía.' : 'No se encontraron resultados.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
