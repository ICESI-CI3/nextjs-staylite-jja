export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  city: string;
  address: string;
  coordinates: Coordinates;
  country?: string;
  placeId?: string;
}

export interface Lodging {
  id: string;
  title: string;
  description: string;
  pricePerNight: number;
  capacity: number;
  images: string[];
  location: Location;
  amenities: string[];
  isActive: boolean;
}
