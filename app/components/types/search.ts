export type OnSearchFn = (
  destination: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  address: string,
  amenities: string,
  maxPrice: number,
  listings?: any[] 
) => void;
