'use client';
import { useEffect, useState } from 'react';
import { LodgingDraft, defaultDraft } from '../types/types';

const DRAFT_KEY = 'createListingDraft';

export function useListingDraft() {
  const [draft, setDraft] = useState<LodgingDraft>(defaultDraft);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setDraft({ ...defaultDraft, ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [draft]);

  const clearDraft = () => localStorage.removeItem(DRAFT_KEY);
  return { draft, setDraft, clearDraft };
}
