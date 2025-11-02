'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import useEditListingLogic from '@/app/hooks/useEditListingLogic';
import { Navbar } from '@/app/components/NavBar/NavBar';
import LodgingMap from '@/app/components/Listing/Map';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ErrorMessage from '@/app/components/ErrorMessage';
import NoLodgingFound from '@/app/components/NoLodgingFound';

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
  const {
    lodging, loading, error,

    formData, setFormData, originalRef,

    newAmenity, setNewAmenity, newImages, setNewImages,
    errorMessage, isSubmitting, toggling, okMsg, localActive,

    handleChange, handleAddAmenity, handleRemoveAmenity,
    handleImageUpload, handleRemoveNewImage, handleRemoveExistingImage,
    handleSubmit, handlePublishToggle, handleDelete, handleBack,

    activeForUI,
  } = useEditListingLogic(listingId as string | undefined);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Ocurrió un error al cargar los datos." />;
  if (!lodging) return <NoLodgingFound />;

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
                <input type="file" multiple className="hidden" onChange={e => handleImageUpload(e.target.files)} />
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
