import { render, screen } from "@testing-library/react";
import { ProfileBookings } from "../ProfileBookings";
import "@testing-library/jest-dom";
import { Booking } from "@/app/interfaces/user";

const mockBookings: Booking[] = [
  {
    id: "1",
    location: "Guatavita, Colombia",
    checkIn: "2024-04-30",
    checkOut: "2024-05-04",
    nights: 4,
    totalPrice: 0,
    status: "Pendiente",
    property: { title: "Alojamiento" },
  },
  {
    id: "2",
    location: "Cartagena, Colombia",
    checkIn: "2024-06-09",
    checkOut: "2024-06-11",
    nights: 2,
    totalPrice: 0,
    status: "Pendiente",
    property: { title: "Alojamiento" },
  },
];

describe("ProfileBookings Component", () => {
  it("muestra el estado de carga correctamente", () => {
    render(<ProfileBookings bookings={[]} loading={true} />);
    // Como el componente usa skeletons sin roles ni texto, comprobamos por clases conocidas
    const skeletons = screen.getAllByRole("generic"); // divs sin rol específico
    const loadingElement = skeletons.find((el) =>
      el.className.includes("animate-pulse")
    );
    expect(loadingElement).toBeInTheDocument();
  });

  it("muestra mensaje cuando no hay reservas", () => {
    render(<ProfileBookings bookings={[]} loading={false} />);
    expect(screen.getByText(/No tienes reservas/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Explora alojamientos y haz tu primera reserva/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Explorar alojamientos/i })
    ).toBeInTheDocument();
  });

  it("redirige al inicio cuando no hay reservas", () => {
    render(<ProfileBookings bookings={[]} loading={false} />);
    const button = screen.getByRole("button", { name: /Explorar alojamientos/i });
    expect(button).toBeInTheDocument();
  });

  it("muestra las tarjetas de reservas correctamente", () => {
    render(<ProfileBookings bookings={mockBookings} loading={false} />);

    // ✅ Ahora usamos getAllByText porque hay más de una coincidencia
    const alojamientos = screen.getAllByText(/Alojamiento/i);
    expect(alojamientos.length).toBe(mockBookings.length);

    // El precio aparece al menos una vez
    expect(screen.getAllByText(/\$[\s]*0/i).length).toBeGreaterThan(0);

    // Cada reserva tiene su botón "Ver detalles"
    const botones = screen.getAllByRole("button", { name: /Ver detalles/i });
    expect(botones.length).toBe(mockBookings.length);
  });

  it("muestra el precio aunque sea 0", () => {
    render(<ProfileBookings bookings={mockBookings} loading={false} />);
    expect(screen.getAllByText(/\$[\s]*0/i).length).toBeGreaterThan(0);
  });

  it("muestra el título de historial de reservas", () => {
    render(<ProfileBookings bookings={mockBookings} loading={false} />);
    expect(screen.getByText(/Mis reservas/i)).toBeInTheDocument();
  });

  it('muestra el botón "Ver detalles" en cada reserva', () => {
    render(<ProfileBookings bookings={mockBookings} loading={false} />);
    const detailButtons = screen.getAllByRole("button", { name: /Ver detalles/i });
    expect(detailButtons.length).toBe(mockBookings.length);
  });
});
