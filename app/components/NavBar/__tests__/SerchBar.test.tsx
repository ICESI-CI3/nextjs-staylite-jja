import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '../SearchBar';


// Mock del componente DayPicker
vi.mock('react-day-picker', () => ({
    DayPicker: ({ onSelect, selected }: any) => (
        <div data-testid="day-picker">
            <button
                onClick={() => {
                    const mockRange = {
                        from: new Date('2025-12-01'),
                        to: new Date('2025-12-10'),
                    };
                    onSelect(mockRange);
                }}
                data-testid="select-dates"
            >
                Select Dates
            </button>
        </div>
    ),
}));

describe('SearchBar Component', () => {
    const mockOnSearch = vi.fn();
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();

        // Crear mock con la misma firma de fetch
        fetchMock = vi.fn<typeof fetch>();
        global.fetch = fetchMock as unknown as typeof fetch;

        // Mockear respuesta por defecto
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => [
                { id: '1', title: 'Listing 1', pricePerNight: 100000 },
                { id: '2', title: 'Listing 2', pricePerNight: 150000 },
            ],
        } as Response);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Renderizado inicial', () => {
        it('debe renderizar todos los campos de búsqueda', () => {
            render(<SearchBar onSearch={mockOnSearch} />);

            expect(screen.getByPlaceholderText('¿A dónde vas?')).toBeInTheDocument();
            expect(screen.getByText('Fecha de entrada')).toBeInTheDocument();
            expect(screen.getByText('Fecha de salida')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Capacidad')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('wifi, piscina...')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Ej: 180000')).toBeInTheDocument();
        });

        it('debe renderizar los botones de búsqueda y limpiar', () => {
            render(<SearchBar onSearch={mockOnSearch} />);

            expect(screen.getByLabelText('Buscar')).toBeInTheDocument();
            expect(screen.getByText('Limpiar')).toBeInTheDocument();
        });

        it('debe tener valores iniciales correctos', () => {
            render(<SearchBar onSearch={mockOnSearch} />);

            const destinationInput = screen.getByPlaceholderText('¿A dónde vas?') as HTMLInputElement;
            const guestsInput = screen.getByPlaceholderText('Capacidad') as HTMLInputElement;
            const amenitiesInput = screen.getByPlaceholderText('wifi, piscina...') as HTMLInputElement;
            const priceInput = screen.getByPlaceholderText('Ej: 180000') as HTMLInputElement;

            expect(destinationInput.value).toBe('');
            expect(guestsInput.value).toBe('1');
            expect(amenitiesInput.value).toBe('');
            expect(priceInput.value).toBe('');
        });
    });

    describe('Interacción con campos de entrada', () => {
        it('debe actualizar el campo de destino al escribir', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            const destinationInput = screen.getByPlaceholderText('¿A dónde vas?');
            await user.type(destinationInput, 'Cartagena');

            expect(destinationInput).toHaveValue('Cartagena');
        });

        it('debe actualizar el campo de huéspedes al cambiar el valor', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            const guestsInput = screen.getByPlaceholderText('Capacidad');
            await user.clear(guestsInput);
            await user.type(guestsInput, '5');

            expect(guestsInput).toHaveValue(5);
        });

        it('debe actualizar el campo de amenities al escribir', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            const amenitiesInput = screen.getByPlaceholderText('wifi, piscina...');
            await user.type(amenitiesInput, 'wifi, piscina');

            expect(amenitiesInput).toHaveValue('wifi, piscina');
        });

        it('debe solo permitir números en el campo de precio', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            const priceInput = screen.getByPlaceholderText('Ej: 180000');
            await user.type(priceInput, '150abc000');

            expect(priceInput).toHaveValue('150000');
        });

        it('debe limpiar caracteres no numéricos del campo de precio', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            const priceInput = screen.getByPlaceholderText('Ej: 180000');
            await user.type(priceInput, '12$34@56');

            expect(priceInput).toHaveValue('123456');
        });
    });

    describe('Calendario (DayPicker)', () => {
        it('debe mostrar el calendario al hacer clic en check-in', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            const checkInButton = screen.getByText('Fecha de entrada');
            await user.click(checkInButton);

            await waitFor(() => {
                expect(screen.getByTestId('day-picker')).toBeInTheDocument();
            });
        });

        it('debe mostrar el calendario al hacer clic en check-out', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            const checkOutButton = screen.getByText('Fecha de salida');
            await user.click(checkOutButton);

            await waitFor(() => {
                expect(screen.getByTestId('day-picker')).toBeInTheDocument();
            });
        });

        it('debe actualizar las fechas cuando se selecciona un rango', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            // Abrir calendario
            const checkInButton = screen.getByText('Fecha de entrada');
            await user.click(checkInButton);

            // Seleccionar fechas
            const selectButton = screen.getByTestId('select-dates');
            await user.click(selectButton);

            await waitFor(() => {
                expect(screen.getByText('2025-12-01')).toBeInTheDocument();
                expect(screen.getByText('2025-12-10')).toBeInTheDocument();
            });
        });

        it('debe cerrar el calendario al hacer clic en "Listo"', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            // Abrir calendario
            const checkInButton = screen.getByText('Fecha de entrada');
            await user.click(checkInButton);

            await waitFor(() => {
                expect(screen.getByTestId('day-picker')).toBeInTheDocument();
            });

            // Cerrar calendario
            const doneButton = screen.getByText('Listo');
            await user.click(doneButton);

            await waitFor(() => {
                expect(screen.queryByTestId('day-picker')).not.toBeInTheDocument();
            });
        });

        it('debe limpiar las fechas al hacer clic en "Limpiar" del calendario', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            // Abrir calendario y seleccionar fechas
            const checkInButton = screen.getByText('Fecha de entrada');
            await user.click(checkInButton);

            const selectButton = screen.getByTestId('select-dates');
            await user.click(selectButton);

            // Verificar que las fechas están mostradas
            await waitFor(() => {
                expect(screen.getByText('2025-12-01')).toBeInTheDocument();
            });

            // Limpiar fechas
            const clearButton = screen.getAllByText('Limpiar')[0]; // El primero es del calendario
            await user.click(clearButton);

            await waitFor(() => {
                expect(screen.getByText('Fecha de entrada')).toBeInTheDocument();
                expect(screen.getByText('Fecha de salida')).toBeInTheDocument();
            });
        });

        it('debe cerrar el calendario al hacer clic fuera de él', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            // Abrir calendario
            const checkInButton = screen.getByText('Fecha de entrada');
            await user.click(checkInButton);

            await waitFor(() => {
                expect(screen.getByTestId('day-picker')).toBeInTheDocument();
            });

            // Simular clic fuera del calendario
            fireEvent.mouseDown(document.body);

            await waitFor(() => {
                expect(screen.queryByTestId('day-picker')).not.toBeInTheDocument();
            });
        });
    });

    describe('Funcionalidad de búsqueda', () => {
        it('debe llamar a la API con los parámetros correctos al buscar', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            // Llenar campos
            await user.type(screen.getByPlaceholderText('¿A dónde vas?'), 'Cali');
            await user.clear(screen.getByPlaceholderText('Capacidad'));
            await user.type(screen.getByPlaceholderText('Capacidad'), '3');
            await user.type(screen.getByPlaceholderText('wifi, piscina...'), 'wifi');
            await user.type(screen.getByPlaceholderText('Ej: 180000'), '200000');

            // Hacer búsqueda
            const searchButton = screen.getByLabelText('Buscar');
            await user.click(searchButton);

            await waitFor(() => {
                expect(fetchMock).toHaveBeenCalledWith(
                    expect.stringContaining('/bookings/search')
                );
            });

            // Verificar parámetros de la URL
            const callUrl = fetchMock.mock.calls[0][0] as string;
            expect(callUrl).toContain('guests=3');
            expect(callUrl).toContain('destination=Cali');
            expect(callUrl).toContain('amenities=wifi');
            expect(callUrl).toContain('maxPrice=200000');
        });

        it('debe llamar al callback onSearch con los resultados', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            await user.type(screen.getByPlaceholderText('¿A dónde vas?'), 'Bogotá');

            const searchButton = screen.getByLabelText('Buscar');
            await user.click(searchButton);

            await waitFor(() => {
                expect(mockOnSearch).toHaveBeenCalledWith(
                    'Bogotá',
                    '',
                    '',
                    1,
                    '',
                    '',
                    0,
                    expect.any(Array)
                );
            });
        });

        it('debe resetear la búsqueda cuando no hay filtros activos', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            const searchButton = screen.getByLabelText('Buscar');
            await user.click(searchButton);

            await waitFor(() => {
                expect(fetchMock).not.toHaveBeenCalled();
                expect(mockOnSearch).toHaveBeenCalledWith('', '', '', 1, '', '', 0);
            });
        });

        it('debe manejar errores de la API correctamente', async () => {
            const user = userEvent.setup();
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            fetchMock.mockRejectedValueOnce(new Error('Network error'));

            render(<SearchBar onSearch={mockOnSearch} />);

            await user.type(screen.getByPlaceholderText('¿A dónde vas?'), 'Medellín');

            const searchButton = screen.getByLabelText('Buscar');
            await user.click(searchButton);

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalled();
                expect(mockOnSearch).toHaveBeenCalledWith(
                    'Medellín',
                    '',
                    '',
                    1,
                    '',
                    '',
                    0,
                    []
                );
            });

            consoleErrorSpy.mockRestore();
        });

        it('debe incluir fechas de check-in y check-out en la búsqueda si están seleccionadas', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            // Abrir calendario y seleccionar fechas
            const checkInButton = screen.getByText('Fecha de entrada');
            await user.click(checkInButton);

            const selectButton = screen.getByTestId('select-dates');
            await user.click(selectButton);

            // Esperar a que las fechas se actualicen
            await waitFor(() => {
                expect(screen.getByText('2025-12-01')).toBeInTheDocument();
            });

            // Hacer búsqueda
            const searchButton = screen.getByLabelText('Buscar');
            await user.click(searchButton);

            await waitFor(() => {
                const callUrl = fetchMock.mock.calls[0][0] as string;
                expect(callUrl).toContain('checkIn=2025-12-01');
                expect(callUrl).toContain('checkOut=2025-12-10');
            });
        });
    });

    describe('Funcionalidad de limpiar', () => {
        it('debe limpiar todos los campos al hacer clic en "Limpiar"', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            // Llenar campos
            await user.type(screen.getByPlaceholderText('¿A dónde vas?'), 'Cali');
            await user.type(screen.getByPlaceholderText('wifi, piscina...'), 'wifi');
            await user.type(screen.getByPlaceholderText('Ej: 180000'), '100000');

            // Limpiar
            const clearButton = screen.getByText('Limpiar');
            await user.click(clearButton);

            // Verificar que los campos están vacíos
            expect(screen.getByPlaceholderText('¿A dónde vas?')).toHaveValue('');
            expect(screen.getByPlaceholderText('wifi, piscina...')).toHaveValue('');
            expect(screen.getByPlaceholderText('Ej: 180000')).toHaveValue('');
            expect(screen.getByPlaceholderText('Capacidad')).toHaveValue(1);
        });

        it('debe llamar a onSearch con valores vacíos al limpiar', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            const clearButton = screen.getByText('Limpiar');
            await user.click(clearButton);

            expect(mockOnSearch).toHaveBeenCalledWith('', '', '', 1, '', '', 0);
        });

        it('debe resetear las fechas del calendario al limpiar', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            // Seleccionar fechas
            const checkInButton = screen.getByText('Fecha de entrada');
            await user.click(checkInButton);

            const selectButton = screen.getByTestId('select-dates');
            await user.click(selectButton);

            await waitFor(() => {
                expect(screen.getByText('2025-12-01')).toBeInTheDocument();
            });

            // Limpiar
            const clearButton = screen.getByText('Limpiar');
            await user.click(clearButton);

            // Verificar que las fechas se resetearon
            expect(screen.getByText('Fecha de entrada')).toBeInTheDocument();
            expect(screen.getByText('Fecha de salida')).toBeInTheDocument();
        });
    });

    describe('Validaciones y casos edge', () => {
        it('debe manejar precio como null cuando el campo está vacío', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            await user.type(screen.getByPlaceholderText('¿A dónde vas?'), 'Test');

            const searchButton = screen.getByLabelText('Buscar');
            await user.click(searchButton);

            await waitFor(() => {
                const callUrl = fetchMock.mock.calls[0][0] as string;
                expect(callUrl).not.toContain('maxPrice');
            });
        });

        it('debe manejar el valor mínimo de huéspedes (1)', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            const guestsInput = screen.getByPlaceholderText('Capacidad') as HTMLInputElement;
            expect(guestsInput.min).toBe('1');
        });

        it('debe prevenir el scroll del mouse en el campo de precio', async () => {
            render(<SearchBar onSearch={mockOnSearch} />);

            const priceInput = screen.getByPlaceholderText('Ej: 180000');
            const blurSpy = vi.spyOn(priceInput as HTMLInputElement, 'blur');

            fireEvent.wheel(priceInput);

            expect(blurSpy).toHaveBeenCalled();
        });

        it('debe usar la URL de API del entorno o el valor por defecto', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            await user.type(screen.getByPlaceholderText('¿A dónde vas?'), 'Test');

            const searchButton = screen.getByLabelText('Buscar');
            await user.click(searchButton);

            await waitFor(() => {
                const callUrl = fetchMock.mock.calls[0][0] as string;
                expect(callUrl).toContain('http://localhost:3000/bookings/search');
            });
        });
    });

    describe('Accesibilidad', () => {
        it('debe tener labels apropiados para los campos', () => {
            render(<SearchBar onSearch={mockOnSearch} />);

            expect(screen.getByText('Ubicación')).toBeInTheDocument();
            expect(screen.getByText('Check-in')).toBeInTheDocument();
            expect(screen.getByText('Check-out')).toBeInTheDocument();
            expect(screen.getByText('Huéspedes')).toBeInTheDocument();
            expect(screen.getByText('Servicios')).toBeInTheDocument();
            expect(screen.getByText('Precio máx/noche')).toBeInTheDocument();
        });

        it('debe tener aria-label en el botón de búsqueda', () => {
            render(<SearchBar onSearch={mockOnSearch} />);

            expect(screen.getByLabelText('Buscar')).toBeInTheDocument();
        });

        it('debe permitir navegación por teclado en los inputs', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            const destinationInput = screen.getByPlaceholderText('¿A dónde vas?');

            await user.tab();
            expect(destinationInput).toHaveFocus();
        });
    });

    describe('Integración con API', () => {
        it('debe construir correctamente la URL con múltiples parámetros', async () => {
            const user = userEvent.setup();
            render(<SearchBar onSearch={mockOnSearch} />);

            // Llenar todos los campos
            await user.type(screen.getByPlaceholderText('¿A dónde vas?'), 'Cartagena');
            await user.clear(screen.getByPlaceholderText('Capacidad'));
            await user.type(screen.getByPlaceholderText('Capacidad'), '4');
            await user.type(screen.getByPlaceholderText('wifi, piscina...'), 'wifi,piscina');
            await user.type(screen.getByPlaceholderText('Ej: 180000'), '250000');

            const searchButton = screen.getByLabelText('Buscar');
            await user.click(searchButton);

            await waitFor(() => {
                const callUrl = fetchMock.mock.calls[0][0] as string;
                expect(callUrl).toContain('destination=Cartagena');
                expect(callUrl).toContain('guests=4');
                expect(callUrl).toContain('amenities=wifi%2Cpiscina');
                expect(callUrl).toContain('maxPrice=250000');
            });
        });

        it('debe procesar correctamente la respuesta de la API', async () => {
            const user = userEvent.setup();
            const mockListings = [
                { id: '1', title: 'Casa en Cartagena', pricePerNight: 150000 },
                { id: '2', title: 'Apartamento en Bogotá', pricePerNight: 120000 },
            ];

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => mockListings,
            });

            render(<SearchBar onSearch={mockOnSearch} />);

            await user.type(screen.getByPlaceholderText('¿A dónde vas?'), 'Cartagena');

            const searchButton = screen.getByLabelText('Buscar');
            await user.click(searchButton);

            await waitFor(() => {
                expect(mockOnSearch).toHaveBeenCalledWith(
                    'Cartagena',
                    '',
                    '',
                    1,
                    '',
                    '',
                    0,
                    mockListings
                );
            });
        });
    });
});