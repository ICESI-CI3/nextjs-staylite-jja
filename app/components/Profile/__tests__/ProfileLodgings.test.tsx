import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileLodgings } from '../ProfileLodgings';
import { vi } from 'vitest';

// Mock de next/image (igual que tu configuración)
vi.mock('next/image', () => ({
  default: (props: any) => {
    const { src, alt, ...rest } = props;
    return React.createElement('img', { src, alt, ...rest });
  },
}));

// Mock de useRouter
const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('ProfileLodgings Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('muestra mensaje cuando no hay alojamientos', () => {
    render(<ProfileLodgings lodgings={[]} loading={false} />);
    expect(screen.getByText(/no tienes alojamientos/i)).toBeInTheDocument();
    expect(screen.getByText(/crear primer alojamiento/i)).toBeInTheDocument();
  });

  it('muestra la lista de alojamientos correctamente', () => {
    const lodgings = [
      {
        id: '1',
        title: 'Casa en Cali',
        description: 'Hermosa casa familiar en Cali',
        images: ['https://example.com/img1.jpg'],
        pricePerNight: 200,
        capacity: 4,
        location: { city: 'Cali', country: 'Colombia' },
        rooms: 2,
        beds: 3,
        baths: 1,
        amenities: ['WiFi', 'Piscina'],
        isActive: true,
      },
      {
        id: '2',
        title: 'Apartamento en Bogotá',
        description: 'Cómodo apartamento en el centro',
        images: [],
        pricePerNight: 300,
        capacity: 2,
        location: { city: 'Bogotá', country: 'Colombia' },
        rooms: 1,
        beds: 1,
        baths: 1,
        amenities: ['Cocina', 'Televisión'],
        isActive: false,
      },
    ];

    render(<ProfileLodgings lodgings={lodgings} loading={false} />);

    expect(screen.getByText(/mis alojamientos/i)).toBeInTheDocument();
    expect(screen.getByText(/Casa en Cali/i)).toBeInTheDocument();
    expect(screen.getByText(/Apartamento en Bogotá/i)).toBeInTheDocument();
  });

  it('redirige al crear nuevo alojamiento', async () => {
    render(<ProfileLodgings lodgings={[]} loading={false} />);
    const button = screen.getByRole('button', { name: /crear primer alojamiento/i });

    fireEvent.click(button);
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/listing/new');
    });
  });

  it('redirige correctamente al hacer click sobre un alojamiento', async () => {
    const lodgings = [
      {
        id: '123',
        title: 'Finca en Armenia',
        description: 'Una finca de descanso perfecta',
        images: ['https://example.com/finca.jpg'],
        pricePerNight: 150,
        capacity: 5,
        location: { city: 'Armenia', country: 'Colombia' },
        rooms: 3,
        beds: 5,
        baths: 2,
        amenities: ['Jardín', 'Cocina', 'WiFi'],
        isActive: true,
      },
    ];

    render(<ProfileLodgings lodgings={lodgings} loading={false} />);

    const lodgingCard = screen.getByText(/Finca en Armenia/i);
    fireEvent.click(lodgingCard);

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/listing/123/dashboard');
    });
  });
});
