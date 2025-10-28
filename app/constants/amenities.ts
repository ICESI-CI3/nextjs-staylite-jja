export type AmenityGroup = { category: string; items: string[] };

export const AMENITIES_GROUPED: AmenityGroup[] = [
  {
    category: 'Conectividad y entretenimiento',
    items: ['Wifi', 'Internet de alta velocidad', 'TV', 'Netflix / Streaming', 'Altavoz Bluetooth'],
  },
  {
    category: 'Clima y confort',
    items: ['Aire acondicionado', 'Calefacción', 'Chimenea', 'Ventiladores de techo', 'Cortinas blackout'],
  },
  {
    category: 'Cocina',
    items: [
      'Cocina', 'Utensilios básicos de cocina', 'Vajilla y cubiertos', 'Horno', 'Microondas',
      'Cafetera', 'Tetera', 'Lavavajillas', 'Refrigerador', 'Congelador',
    ],
  },
  {
    category: 'Lavado y limpieza',
    items: ['Lavadora', 'Secadora', 'Plancha', 'Tabla de planchar', 'Secador de pelo', 'Toallas', 'Ropa de cama'],
  },
  {
    category: 'Seguridad',
    items: ['Detector de humo', 'Detector de monóxido de carbono', 'Extintor', 'Botiquín', 'Cerradura inteligente', 'Caja fuerte'],
  },
  {
    category: 'Estacionamiento y movilidad',
    items: [
      'Parqueadero', 'Estacionamiento gratuito en la calle', 'Estacionamiento privado',
      'Cargador para vehículo eléctrico', 'Bicicletas disponibles',
    ],
  },
  {
    category: 'Exterior y recreación',
    items: [
      'Piscina', 'Jacuzzi', 'Sauna', 'Terraza / Balcón', 'Patio', 'BBQ / Parrilla',
      'Jardín', 'Vista a la ciudad', 'Vista al mar', 'Acceso a la playa',
    ],
  },
  {
    category: 'Trabajo y fitness',
    items: ['Gimnasio', 'Escritorio de trabajo', 'Silla ergonómica', 'Espacio de coworking'],
  },
  {
    category: 'Familias y niños',
    items: ['Cuna', 'Silla para bebé', 'Juegos de mesa', 'Parque infantil'],
  },
  {
    category: 'Accesibilidad',
    items: ['Acceso para PMR', 'Acceso sin escalones', 'Ducha accesible', 'Ascensor'],
  },
  {
    category: 'Políticas y extras',
    items: ['Apto para mascotas', 'Apto para familias / niños'],
  },
];
