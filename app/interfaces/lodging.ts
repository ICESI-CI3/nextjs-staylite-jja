export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LodgingLocation {
  city: string;
  address: string;
  coordinates: Coordinates;
  country?: string;
  placeId?: string;
}

export interface LodgingHost {
  id: string;
  name?: string;
  email?: string;
}

export interface Lodging {
  id: string;
  title: string;
  description: string;
  pricePerNight: number;   
  capacity: number;

  rooms: number;
  beds: number;
  baths: number;

  images: string[];
  location: LodgingLocation;
  amenities: string[];
  isActive: boolean;

  host?: LodgingHost;
}
