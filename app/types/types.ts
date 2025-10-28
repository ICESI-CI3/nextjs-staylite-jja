export type Coordinates = { lat: number; lng: number };

export type LodgingLocation = {
  country: string;
  countryCode?: string;
  state?: string;
  city: string;
  neighborhood?: string;
  address: string;
  postalCode?: string;
  coordinates: Coordinates;
  placeId?: string;
};

export type LodgingDraft = {
  id?: string;
  title: string;
  description: string;
  pricePerNight: number | null;
  capacity: number;
  rooms: number;
  beds: number;
  baths: number;
  location: LodgingLocation;
  images: string[];  // Las imágenes son un arreglo de strings (Base64)
  amenities: string[];
};

export const defaultDraft: LodgingDraft = {
  title: '',
  description: '',
  pricePerNight: null,
  capacity: 1,
  rooms: 1,
  beds: 1,
  baths: 1,
  location: {
    country: '',
    city: '',
    address: '',
    coordinates: { lat: 0, lng: 0 },
  },
  images: [],
  amenities: [],
};

export type CreateLodgingPayload = {
  title: string;
  description: string;
  pricePerNight: number;
  capacity: number;
  rooms: number;
  beds: number;
  baths: number;
  location: LodgingLocation;
  images: string[];  // Definido como un arreglo de strings, no como un map
  amenities: string[];
};

export function buildCreatePayload(draft: LodgingDraft): CreateLodgingPayload {
  return {
    title: draft.title,
    description: draft.description,
    pricePerNight: draft.pricePerNight ?? 0, // Aseguramos que nunca sea null
    capacity: draft.capacity,
    rooms: draft.rooms,
    beds: draft.beds,
    baths: draft.baths,
    location: {
      country: draft.location.country,
      countryCode: draft.location.countryCode,
      state: draft.location.state,
      city: draft.location.city,
      neighborhood: draft.location.neighborhood,
      address: draft.location.address,
      postalCode: draft.location.postalCode,
      coordinates: draft.location.coordinates,
      placeId: draft.location.placeId,
    },
    images: draft.images,  // Imágenes ya en Base64
    amenities: draft.amenities,
  };
}
