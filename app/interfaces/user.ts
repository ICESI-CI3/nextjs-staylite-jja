export interface User {
  id: string;               
  name: string;             
  email: string;            
  roles: string[];          
  isActive: boolean;        
  
  twoFactorSecret?: string;
  qrCodeUrl?: string;       
  
  lodgings?: Lodging[];
  bookings?: Booking[];
}
export interface Location {
  city?: string;
  country?: string;
  address?: string;
  state?: string;
  zipCode?: string;
}

export interface Lodging {
  id: string;
  title: string;
  description?: string;
  pricePerNight: number;
  location?: Location;
  images?: string[];
  amenities?: string[];
  
  maxGuests?: number;
  capacity?: number;  // Alias de maxGuests
  bedrooms?: number;
  rooms?: number;    
  bathrooms?: number;
  baths?: number;   
  
  isActive?: boolean;
  
  ownerId?: string;
  hostId?: string;
  owner?: {
    id: string;
    name?: string;
  };
  host?: {
    id: string;
    name?: string;
  };
}

export interface Booking {
  id: string;
  lodgingId: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
  totalPrice?: number;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt?: string;

  lodging?: {
    id: string;
    title: string;
    images?: string[];
    location?: {
      city?: string;
    };
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface LodgingStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  recentBookings: Booking[];
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  password?: string;
  roles?: string[];
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';


export interface UseProfileReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseProfileDataReturn {
  lodgings: Lodging[];
  bookings: Booking[];
  loading: boolean;
  loadingLodgings: boolean;
  loadingBookings: boolean;
  error: string | null;
  refetchLodgings: () => Promise<void>;
  refetchBookings: () => Promise<void>;
}


export interface UseLodgingStatsReturn {
  lodging: Lodging | null;
  bookings: Booking[];
  stats: LodgingStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

