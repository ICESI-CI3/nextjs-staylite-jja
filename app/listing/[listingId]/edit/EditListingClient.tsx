'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useFetchLodging from '@/app/hooks/useFetchLodgingid';
import { Navbar } from '@/app/components/NavBar/NavBar';
import LodgingMap from '@/app/components/Listing/Map';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ErrorMessage from '@/app/components/ErrorMessage';
import NoLodgingFound from '@/app/components/NoLodgingFound';
import { LodgingForm } from '@/app/interfaces/lodging';
import { useLodgingActions } from '@/app/hooks/useLodgingActions';

const LS = {
  ACTIVE: 'activeRole',
  VIEWAS: 'viewAs',
  PREV: 'prevActiveRole',
  AUTH: 'authToken',
} as const;

const numberFields = ['pricePerNight', 'capacity', 'rooms', 'beds', 'baths'];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => { reader.abort(); reject(new Error('Error leyendo archivo')); };
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

const normalizeServerMessages = async (res: Response) => {
  try {
    const body = await res.json().catch(() => null);
    if (!body) return [`Error ${res.status}`];
    if (Array.isArray(body.message)) return body.message.map(String);
    if (typeof body.message === 'string') return body.message.split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean);
    if (body.errors && typeof body.errors === 'object') {
      const out: string[] = [];
      for (const k of Object.keys(body.errors)) {
        const v = (body as any).errors[k];
        if (Array.isArray(v)) out.push(...v.map(String)); else out.push(String(v));
      }
      return out.length ? out : [JSON.stringify(body)];
    }
    return [JSON.stringify(body)];
  } catch { return [`Error ${res.status}`]; }
};

const validateFormData = (data: LodgingForm, finalImages: string[]) => {
  const errors: string[] = [];
  if (typeof data.title !== 'string' || data.title.trim() === '') errors.push('El título debe ser una cadena de texto.');
  if (typeof data.description !== 'string' || data.description.trim() === '') errors.push('La descripción debe ser una cadena de texto.');
  if (typeof data.pricePerNight !== 'number' || Number.isNaN(data.pricePerNight)) errors.push('El precio por noche debe ser un número.');
  else if (data.pricePerNight < 0) errors.push('El precio por noche no puede ser negativo.');
  const intFields: Array<{ name: keyof LodgingForm; value: any; min: number }> = [
    { name: 'capacity', value: data.capacity, min: 1 },
    { name: 'rooms', value: data.rooms, min: 1 },
    { name: 'beds', value: data.beds, min: 1 },
    { name: 'baths', value: data.baths, min: 0 },
  ];
  for (const f of intFields) {
    if (typeof f.value !== 'number' || Number.isNaN(f.value) || !Number.isInteger(f.value)) errors.push(`El campo ${String(f.name)} debe ser un número entero.`);
    else if (f.value < f.min) errors.push(`El campo ${String(f.name)} no puede ser menor que ${f.min}.`);
  }
  if (!Array.isArray(data.amenities)) errors.push('Las comodidades deben ser un arreglo.');
  else for (const a of data.amenities) { if (typeof a !== 'string' || a.trim() === '') { errors.push('Cada comodidad debe ser una cadena de texto no vacía.'); break; } }
  if (typeof data.city !== 'string' || data.city.trim() === '') errors.push('La ciudad debe ser una cadena de texto válida.');
  if (typeof data.address !== 'string' || data.address.trim() === '') errors.push('La dirección debe ser una cadena de texto válida.');
  if (typeof data.coordinates !== 'object' || data.coordinates == null || typeof (data.coordinates as any).lat !== 'number' || typeof (data.coordinates as any).lng !== 'number') errors.push('La ubicación debe incluir coordenadas válidas (lat y lng).');
  if (!Array.isArray(finalImages)) errors.push('Las imágenes deben ser un arreglo.');
  else if (finalImages.length === 0) errors.push('Las imágenes no deben estar vacías.');
  else for (const img of finalImages) { if (typeof img !== 'string' || img.trim() === '') { errors.push('Cada imagen debe ser una URL o cadena (no vacía).'); break; } }
  return errors;
};

const StatusPill = ({ active }: { active: boolean }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${active ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
    {active ? 'Activo' : 'Desactivado'}
  </span>
);

const SuccessOverlay = ({ text }: { text: string }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/30" />
    <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs text-center">
      <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold">¡Actualizado!</h3>
      <p className="text-sm text-gray-600 mt-1">{text}</p>
    </div>
  </div>
);

const EditListingClient: React.FC = () => {
  const { listingId } = useParams();
  const router = useRouter();
  const { lodging, loading, error } = useFetchLodging(listingId as string);
  const { uploadImages } = useLodgingActions();

  const [formData, setFormData] = useState<LodgingForm>({
    title: '',
    description: '',
    pricePerNight: 0,
    capacity: 1,
    rooms: 1,
    beds: 1,
    baths: 1,
    amenities: [],
    city: '',
    address: '',
    coordinates: { lat: 0, lng: 0 },
    images: [],
  });

  const originalRef = useRef<LodgingForm | null>(null);
  const [newAmenity, setNewAmenity] = useState('');
  const [newImages, setNewImages] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localActive, setLocalActive] = useState<boolean | null>(null);
  const [toggling, setToggling] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  useEffect(() => {
    if (lodging) {
      const initial: LodgingForm = {
        title: lodging.title ?? '',
        description: lodging.description ?? '',
        pricePerNight: typeof lodging.pricePerNight === 'number' ? lodging.pricePerNight : 0,
        capacity: lodging.capacity ?? 1,
        rooms: lodging.rooms ?? 1,
        beds: lodging.beds ?? 1,
        baths: lodging.baths ?? 1,
        amenities: lodging.amenities ?? [],
        city: lodging.location?.city ?? '',
        address: lodging.location?.address ?? '',
        coordinates: lodging.location?.coordinates ?? { lat: 0, lng: 0 },
        images: lodging.images ?? [],
      };
      setFormData(initial);
      originalRef.current = JSON.parse(JSON.stringify(initial));
      if (typeof lodging.isActive === 'boolean') setLocalActive(lodging.isActive);
    }
  }, [lodging]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    const parsedValue = numberFields.includes(name) && value !== '' ? Number(value) : value;
    setFormData(prev => ({ ...prev, [name]: parsedValue } as any));
  };

  const handleAddAmenity = () => {
    const trimmed = newAmenity.trim();
    if (trimmed && !formData.amenities.includes(trimmed)) {
      setFormData(prev => ({ ...prev, amenities: [...prev.amenities, trimmed] }));
      setNewAmenity('');
    }
  };

  const handleRemoveAmenity = (amenity: string) =>
    setFormData(prev => ({ ...prev, amenities: prev.amenities.filter(a => a !== amenity) }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles = filesArray.filter(file => {
        if (!file.type.startsWith('image/')) { setErrorMessage(['Solo se pueden subir imágenes.']); return false; }
        if (file.size > 5 * 1024 * 1024) { setErrorMessage(['El archivo es demasiado grande (máx 5MB).']); return false; }
        return true;
      });
      if (validFiles.length > 0) { setErrorMessage(null); setNewImages(prev => [...prev, ...validFiles]); }
    }
  };

  const handleRemoveNewImage = (index: number) => setNewImages(prev => prev.filter((_, i) => i !== index));
  const handleRemoveExistingImage = (index: number) =>
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));

  const handleSubmit = async () => {
    setErrorMessage(null);
    try {
      const token = localStorage.getItem(LS.AUTH) ?? '';
      if (!token) return setErrorMessage(['No autenticado. Por favor, inicia sesión.']);
      if (!originalRef.current) return setErrorMessage(['No se pudo comparar cambios. Recarga la página e intenta de nuevo.']);

      setIsSubmitting(true);

      let newImageStrings: string[] = [];
      if (newImages.length > 0) {
        try {
          if (typeof uploadImages === 'function') {
            const maybe = await uploadImages(newImages);
            if (Array.isArray(maybe) && maybe.every(i => typeof i === 'string')) newImageStrings = maybe as string[];
            else newImageStrings = await Promise.all(newImages.map(f => fileToBase64(f)));
          } else {
            newImageStrings = await Promise.all(newImages.map(f => fileToBase64(f)));
          }
        } catch {
          setErrorMessage(['Error al procesar imágenes. Intenta nuevamente.']);
          setIsSubmitting(false);
          return;
        }
      }

      const finalImages = [...(formData.images ?? []), ...newImageStrings];
      const localErrors = validateFormData(formData, finalImages);
      if (localErrors.length > 0) {
        setErrorMessage(localErrors);
        setIsSubmitting(false);
        return;
      }

      const diff: any = {};
      const orig = originalRef.current;
      (['title','description','pricePerNight','capacity','rooms','beds','baths'] as const).forEach(k=>{
        if (JSON.stringify(orig[k]) !== JSON.stringify(formData[k])) diff[k] = formData[k];
      });
      const loc:any = {};
      if ((orig.city??'') !== (formData.city??'')) loc.city = formData.city;
      if ((orig.address??'') !== (formData.address??'')) loc.address = formData.address;
      const oc = orig.coordinates||{lat:0,lng:0}, nc = formData.coordinates||{lat:0,lng:0};
      const cd:any = {};
      if (oc.lat!==nc.lat) cd.lat = nc.lat;
      if (oc.lng!==nc.lng) cd.lng = nc.lng;
      if (Object.keys(cd).length) loc.coordinates = cd;
      if (Object.keys(loc).length) diff.location = loc;
      if (JSON.stringify(orig.amenities??[]) !== JSON.stringify(formData.amenities??[])) diff.amenities = formData.amenities;
      if (newImageStrings.length) diff.images = newImageStrings;

      if (Object.keys(diff).length === 0) {
        setOkMsg('Sin cambios');
        setTimeout(()=>setOkMsg(null), 1800);
        setIsSubmitting(false);
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
      const res = await fetch(`${apiBase}/lodgings/${listingId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(diff),
      });

      if (!res.ok) {
        const serverMsgs = await normalizeServerMessages(res);
        setErrorMessage(serverMsgs);
        setIsSubmitting(false);
        return;
      }

      const merged = { ...orig, ...diff };
      originalRef.current = JSON.parse(JSON.stringify(merged));
      setFormData(prev => ({ ...prev, ...diff }));
      setNewImages([]);
      setErrorMessage(null);
      setOkMsg('Cambios guardados');
      setTimeout(()=>setOkMsg(null), 1800);
      setIsSubmitting(false);
    } catch (err: any) {
      setErrorMessage([err?.message || 'Error actualizando listing']);
      setIsSubmitting(false);
    }
  };

  const handlePublishToggle = async () => {
    setErrorMessage(null);
    try {
      const token = (typeof window !== 'undefined' && (localStorage.getItem(LS.AUTH) || localStorage.getItem('authToken'))) || '';
      if (!token) return setErrorMessage(['Falta autenticación. Por favor inicia sesión.']);
      if (!listingId) return setErrorMessage(['El ID del listing no está disponible.']);

      const prev = localActive ?? Boolean(lodging?.isActive);
      setToggling(true);
      setLocalActive(!prev);

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
      let res = await fetch(`${apiBase}/lodgings/${encodeURIComponent(String(listingId))}/changeActive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        cache: 'no-store',
      });

      if (!res.ok) {
        res = await fetch(`${apiBase}/lodgings/${encodeURIComponent(String(listingId))}/changeActive`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          cache: 'no-store',
        });
      }

      if (!res.ok) {
        setLocalActive(prev);
        let msg = `Error ${res.status}`;
        try {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const body = await res.json();
            msg = Array.isArray(body?.message) ? body.message.join(', ') : body?.message || msg;
          } else {
            const text = await res.text();
            msg = text || msg;
          }
        } catch {}
        throw new Error(msg);
      }

      try {
        const data = await res.json();
        if (typeof data?.isActive === 'boolean') setLocalActive(data.isActive);
        setOkMsg(data?.isActive ? 'Activado' : 'Desactivado');
      } catch {
        setOkMsg(!prev ? 'Activado' : 'Desactivado');
      }
      setTimeout(()=>setOkMsg(null), 1800);
    } catch (err: any) {
      setErrorMessage([err?.message ?? 'No fue posible cambiar estado de publicación']);
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('authToken') ?? '';
      if (!token) return setErrorMessage(['Falta autenticación. Por favor inicia sesión.']);
      if (!listingId) return setErrorMessage(['El ID del listing no está disponible.']);

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
      const url = `${apiBase}/lodgings/${listingId}`;

      const res = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const body = await res.text();
        setErrorMessage([`No fue posible eliminar el listing (${res.status}): ${body || 'Error desconocido'}`]);
        return;
      }
      router.push('/');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMessage([msg || 'Error desconocido al eliminar el listing.']);
    }
  };

  const handleBack = () => {
    const role = localStorage.getItem(LS.ACTIVE) || 'client';
    if (role === 'client') router.push('/client/listings');
    else if (role === 'admin') router.push('/admin/listings');
    else router.push('/');
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Ocurrió un error al cargar los datos." />;
  if (!lodging) return <NoLodgingFound />;

  const activeForUI = (localActive ?? Boolean(lodging.isActive));

  return (
    <div>
      <Navbar onSearch={() => { }} />
      <div className="container mx-auto px-4 py-4">
        <button onClick={handleBack} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md">← Regresar</button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Editar Alojamiento</h1>
          <StatusPill active={activeForUI} />
        </div>

        {!activeForUI && (
          <div className="mb-4 px-4 py-2 rounded-md bg-yellow-100 text-yellow-900 border border-yellow-300">
            Este alojamiento está <strong>desactivado</strong>. Solo tú puedes verlo y editarlo.
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-2 ${isSubmitting ? 'bg-emerald-300' : 'bg-emerald-600'} text-white rounded-md`}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>

          <button
            onClick={handlePublishToggle}
            disabled={toggling}
            className={`px-4 py-2 text-white rounded-md ${activeForUI ? 'bg-yellow-500' : 'bg-emerald-600'} ${toggling ? 'opacity-70 cursor-not-allowed' : ''}`}
            title={activeForUI ? 'Desactivar' : 'Activar'}
          >
            {toggling ? 'Aplicando...' : (activeForUI ? 'Desactivar' : 'Activar')}
          </button>

          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md">Eliminar</button>
        </div>

        {errorMessage && (
          <div className="mb-4 text-red-600">
            <ul className="list-disc ml-5">
              {errorMessage.map((m, i) => (<li key={i}>{m}</li>))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-semibold">Título</label>
            <input name="title" value={formData.title} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />

            <label className="block mt-4 mb-2 font-semibold">Descripción</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" rows={5} />

            <label className="block mt-4 mb-2 font-semibold">Precio por noche</label>
            <input type="number" name="pricePerNight" value={formData.pricePerNight as any} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="block font-semibold">Capacidad</label>
                <input type="number" name="capacity" value={formData.capacity as any} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block font-semibold">Habitaciones</label>
                <input type="number" name="rooms" value={formData.rooms as any} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block font-semibold">Camas</label>
                <input type="number" name="beds" value={formData.beds as any} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block font-semibold">Baños</label>
                <input type="number" name="baths" value={formData.baths as any} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>

            <h3 className="mt-4 font-semibold">Comodidades</h3>
            <div className="flex gap-2 mb-2">
              <input value={newAmenity} onChange={e => setNewAmenity(e.target.value)} placeholder="Nueva comodidad" className="px-2 py-1 border rounded-md" />
              <button type="button" onClick={handleAddAmenity} className="px-2 py-1 bg-blue-600 text-white rounded-md">Agregar</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.amenities.map((a, i) => (
                <div key={i} className="flex items-center gap-1 bg-gray-200 px-2 py-1 rounded-full">
                  <span>{a}</span>
                  <button type="button" onClick={() => handleRemoveAmenity(a)} className="flex items-center justify-center w-5 h-5 bg-red-600 text-white rounded-full text-xs">×</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-2 font-semibold">Ciudad</label>
            <input name="city" value={formData.city} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />

            <label className="block mt-4 mb-2 font-semibold">Dirección</label>
            <input name="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />

            {formData.coordinates?.lat != null && formData.coordinates?.lng != null && (
              <div className="mt-4">
                <LodgingMap lat={formData.coordinates.lat} lng={formData.coordinates.lng} title={formData.title} heightClass="h-64" />
              </div>
            )}

            <h3 className="mt-4 font-semibold">Imágenes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-2">
              {formData.images.map((img, i) => (
                <div key={i} className="relative w-full rounded-md overflow-hidden bg-gray-100 aspect-square">
                  <img src={img} alt={`Imagen ${i}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => handleRemoveExistingImage(i)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center">×</button>
                </div>
              ))}

              {newImages.map((file, i) => (
                <div key={`new-${i}`} className="relative w-full rounded-md overflow-hidden bg-gray-100 aspect-square">
                  <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => handleRemoveNewImage(i)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center">×</button>
                </div>
              ))}

              <label className="flex items-center justify-center w-full rounded-md border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-500 bg-gray-50 aspect-square">
                <input type="file" multiple className="hidden" onChange={handleImageUpload} />
                <span className="text-gray-400 text-3xl">+</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {okMsg && <SuccessOverlay text={okMsg} />}
    </div>
  );
};

export default EditListingClient;
