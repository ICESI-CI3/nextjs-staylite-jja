'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/app/components/NavBar/NavBar';
import { useCreateLodging } from '@/app/hooks/useCreateLodging';
import { useListingDraft } from '@/app/stores/useListingDraft';
import { LodgingDraft } from '@/app/types/types';

import StepBasics from '@/app/components/Listing/StepBasics';
import StepTitleDesc from '@/app/components/Listing/StepTitleDesc';
import StepPrice from '@/app/components/Listing/StepPrice';
import StepLocation from '@/app/components/Listing/StepLocation';
import StepAmenities from '@/app/components/Listing/StepAmenities';
import StepPhotos from '@/app/components/Listing/StepPhotos';
import StepReview from '@/app/components/Listing/StepReview';
import BottomBar from '@/app/components/Listing/BottomBar';

function readRoles(): string[] {
  try {
    const raw = localStorage.getItem('roles');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    return Array.from(new Set(arr.map((r) => String(r).trim().toLowerCase()).filter(Boolean)));
  } catch { return []; }
}

export default function NewListingPage() {
  const router = useRouter();
  const { draft, setDraft, clearDraft } = useListingDraft();
  const { createLodging, loading: creating, error: createError } = useCreateLodging('http://localhost:3000');

  const [imageFiles, setImageFiles] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const roles = readRoles();
    const isHost = roles.includes('host') || roles.includes('admin');

    if (!token) {
      localStorage.setItem('postLoginRedirect', '/listing/new');
      localStorage.setItem('signupRole', 'host');
      router.replace('/?authOpen=1&tab=login');
      return;
    }
    if (!isHost) router.replace('/');
  }, [router]);

  const [step, setStep] = useState(0);
  const steps = useMemo(() => [
    'Básicos',
    'Título y descripción',
    'Precio por noche',
    'Ubicación',
    'Comodidades',
    'Fotos',
    'Revisión',
  ], []);

  const canNext = useMemo(() => {
    switch (step) {
      case 0:
        return draft.capacity > 0 && draft.rooms > 0 && draft.beds > 0 && draft.baths >= 0;
      case 1:
        return draft.title.trim().length >= 6 && draft.description.trim().length >= 20;
      case 2:
        return !!draft.pricePerNight && draft.pricePerNight > 0;
      case 3:
        return (
          draft.location.country.trim().length > 0 &&
          draft.location.city.trim().length > 1 &&
          draft.location.address.trim().length > 3 &&
          typeof draft.location.coordinates?.lat === 'number' &&
          typeof draft.location.coordinates?.lng === 'number' &&
          (draft.location.coordinates.lat !== 0 || draft.location.coordinates.lng !== 0)
        );
      case 4:
        return draft.amenities.length >= 0;
      case 5:
        return Array.isArray(imageFiles) && imageFiles.length > 0;
      case 6:
        return true;
      default:
        return false;
    }
  }, [step, draft, imageFiles]);

  const submit = async () => {
    try {
      setSubmitting(true);

    const base64Images = imageFiles.map((file) => {
      return file;  
    });

      const lodgingPayload = {
        title: String(draft.title).trim(),
        description: String(draft.description).trim(),
        pricePerNight: draft.pricePerNight ?? 0,
        capacity: draft.capacity,
        rooms: draft.rooms,
        beds: draft.beds,
        baths: draft.baths,
        location: draft.location,
        images: base64Images,  // Ahora pasamos directamente las imágenes en Base64 sin encabezado
        amenities: draft.amenities ?? [],
      };

      // Usamos el hook `createLodging` para enviar el alojamiento
      const json = await createLodging(lodgingPayload, base64Images);  // Pasamos el payload y las imágenes

      console.log('Alojamiento creado con éxito:', json);

      if (json?.id) {
        setDraft((prevDraft) => ({
          ...prevDraft,
          id: json.id, // Asignar el ID recibido de la respuesta al draft
        }));
      }

      // Limpiar el draft y redirigir a la página del nuevo alojamiento
      clearDraft();
      router.replace(`/listing/${json?.id ?? ''}`);
      setSubmitting(false);

    } catch (e: any) {
      if (e?.code === 'UNAUTHENTICATED' || e?.code === 'UNAUTHORIZED') {
        localStorage.setItem('postLoginRedirect', '/listing/new');
        localStorage.setItem('signupRole', 'host');
        router.replace('/?authOpen=1&tab=login');
        return;
      }
      alert(e?.message ?? 'No se pudo crear el listing');
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <StepBasics draft={draft as LodgingDraft} setDraft={setDraft} />;
      case 1: return <StepTitleDesc draft={draft as LodgingDraft} setDraft={setDraft} />;
      case 2: return <StepPrice draft={draft as LodgingDraft} setDraft={setDraft} />;
      case 3: return <StepLocation draft={draft as LodgingDraft} setDraft={setDraft} />;
      case 4: return <StepAmenities draft={draft as LodgingDraft} setDraft={setDraft} />;
      case 5: return <StepPhotos imageFiles={imageFiles} setImageFiles={setImageFiles} />;
      case 6: return <StepReview draft={draft as LodgingDraft} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar onSearch={() => {}} />

      <main className="container mx-auto px-4 py-10">
        {renderStep()}
        {createError && <p className="text-sm text-red-600 mt-6">Error al crear: {createError}</p>}
      </main>

      <BottomBar
        step={step}
        stepsTotal={steps.length}
        canNext={canNext}
        submitting={submitting}
        creating={creating}
        onBack={() => setStep(s => Math.max(0, s - 1))}
        onNext={() => setStep(s => s + 1)}
        onPublish={submit}
      />
    </div>
  );
}
