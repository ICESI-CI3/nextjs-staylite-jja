'use client';

import React, { useMemo, useEffect, useState } from 'react';

type Props = {
  imageFiles: string[];  // Cambia el tipo de File[] a string[] para almacenar las imágenes en Base64
  setImageFiles: React.Dispatch<React.SetStateAction<string[]>>;
};

export default function StepPhotos({ imageFiles, setImageFiles }: Props) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const files = Array.isArray(imageFiles) ? imageFiles : [];

  // Función para convertir la imagen a Base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);  // Convierte la imagen a Base64
    });
  };

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Solo se pueden subir imágenes.');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.');
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const addFiles = async (incoming: File[]) => {
    if (!incoming?.length) return;
    
    // Convierte las imágenes seleccionadas a Base64
    const validFiles = await Promise.all(incoming.filter(validateFile).map(async (file) => {
      const base64 = await convertToBase64(file);  // Convierte a Base64
      return base64;
    }));

    if (validFiles.length > 0) {
      setImageFiles(prev => [...(Array.isArray(prev) ? prev : []), ...validFiles]);
    }
  };

  const onSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    addFiles(Array.from(list));
    e.target.value = ''; 
  };

  const onDrop: React.DragEventHandler<HTMLLabelElement> = ev => {
    ev.preventDefault();
    const list = ev.dataTransfer?.files;
    if (!list?.length) return;
    addFiles(Array.from(list));
  };

  const prevent: React.DragEventHandler = ev => ev.preventDefault();

  const previews = useMemo(() => {
    return files.map(f => ({
      key: `${f}-${f.length}`, // Utiliza el Base64 directamente para crear un identificador único
      name: 'Imagen',
      url: f,  // Aquí simplemente mostramos el Base64 como una URL
    }));
  }, [files]);

  useEffect(() => {
    return () => {
      previews.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Agrega fotos</h2>
      <p className="text-sm text-gray-600 mb-4">Sube varias imágenes (máx. 20). No se aceptan URLs.</p>

      <label
        onDrop={onDrop}
        onDragOver={prevent}
        onDragEnter={prevent}
        className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition"
      >
        <div className="flex flex-col items-center gap-2">
          <i className="fa fa-cloud-upload text-3xl text-gray-500" />
          <span className="text-gray-700">Arrastra tus imágenes aquí</span>
          <span className="text-xs text-gray-500">o haz clic para seleccionar</span>
          <input type="file" accept="image/*" multiple onChange={onSelectFiles} className="hidden" />
        </div>
      </label>

      {errorMessage && (
        <p className="text-sm text-red-600 mt-4">{errorMessage}</p>
      )}

      {previews.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previews.map((p, i) => (
            <div key={p.key} className="relative group rounded-xl overflow-hidden border bg-white">
              <img src={p.url} alt={p.name} className="w-full h-36 object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition" />
              <button
                type="button"
                onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute top-2 right-2 bg-black/70 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition"
                aria-label={`Quitar imagen ${i + 1}`}
              >
                Quitar
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[11px] px-2 py-1 truncate">
                {p.name}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-600 mt-4">Aún no has seleccionado imágenes.</p>
      )}
    </div>
  );
}
