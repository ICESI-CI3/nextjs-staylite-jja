export type OnSearchFn = (
  destination: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  address: string,
  amenities: string,
  pricePerNight: number
) => void;

