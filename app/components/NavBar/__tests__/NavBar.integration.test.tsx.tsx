import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuthStore } from '@/app/stores/stores';
import Navbar from '../NavBar';

// Mocks
vi.mock('@/app/components/navigation/SearchBar', () => ({
    SearchBar: ({ onSearch }: any) => (
        <div data-testid="search-bar">
            <button onClick={() => onSearch('test', '', '', 1, '', '', 0, [])}>
                Mock Search
            </button>
        </div>
    ),
}));

vi.mock('@/app/components/auth/HostAuthModal', () => ({
    HostAuthModal: ({ open, onClose, setIsAuthenticated, setUserName }: any) => (
        open ? (
            <div data-testid="host-auth-modal">
                <button onClick={onClose}>Close Modal</button>
                <button onClick={() => {
                    setIsAuthenticated(true);
                    setUserName('Test User');
                    localStorage.setItem('authToken', 'test-token');
                    localStorage.setItem('userName', 'Test User');
                    localStorage.setItem('roles', JSON.stringify(['guest']));
                    localStorage.setItem('userId', 'user-123');
                    onClose();
                }}>
                    Mock Login
                </button>
            </div>
        ) : null
    ),
}));

vi.mock('font-awesome/css/font-awesome.min.css', () => ({}));

describe('Navbar - Integration Tests', () => {
    const mockOnSearch = vi.fn();
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        // Crear un mock tipado como fetch
        fetchMock = vi.fn<typeof fetch>();
        global.fetch = fetchMock as unknown as typeof fetch;

        // Reset Zustand store
        useAuthStore.setState({
            token: null,
            name: '',
            tab: 'signup',
            emailS: '',
            passS: '',
            emailL: '',
            passL: '',
            err: '',
            twoFactorCode: '',
            qrCodeUrl: null,
            is2FARequired: false,
            loading: false,
        });

        // Mockear respuesta por defecto
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ roles: ['guest, host'] }),
        } as Response);
    });


    describe('Flujo completo de autenticación', () => {
        it('debe completar flujo: no autenticado -> login -> autenticado', async () => {
            const user = userEvent.setup();
            const mockPush = vi.fn();
            vi.mocked(require('next/navigation').useRouter).mockReturnValue({
                push: mockPush,
                replace: vi.fn(),
                refresh: vi.fn(),
            });

            render(<Navbar onSearch={mockOnSearch} />);

            // Estado inicial: no autenticado
            expect(screen.getByLabelText('Perfil / Iniciar sesión')).toBeInTheDocument();
            expect(screen.queryByText('Ir al perfil')).not.toBeInTheDocument();

            // Abrir modal
            await user.click(screen.getByLabelText('Perfil / Iniciar sesión'));

            await waitFor(() => {
                expect(screen.getByTestId('host-auth-modal')).toBeInTheDocument();
            });

            // Hacer login
            await user.click(screen.getByText('Mock Login'));

            // Estado final: autenticado
            await waitFor(() => {
                expect(screen.queryByTestId('host-auth-modal')).not.toBeInTheDocument();
                expect(screen.getByText('Ir al perfil')).toBeInTheDocument();
                expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
            });
        });

        it('debe completar flujo: autenticado -> logout -> no autenticado', async () => {
            const user = userEvent.setup();
            const mockPush = vi.fn();
            const mockRefresh = vi.fn();
            vi.mocked(require('next/navigation').useRouter).mockReturnValue({
                push: mockPush,
                replace: vi.fn(),
                refresh: mockRefresh,
            });

            // Setup: usuario autenticado
            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('userName', 'John Doe');
            localStorage.setItem('roles', JSON.stringify(['guest']));
            useAuthStore.setState({ token: 'test-token', name: 'John Doe' });

            render(<Navbar onSearch={mockOnSearch} />);

            // Estado inicial: autenticado
            expect(screen.getByText('Ir al perfil')).toBeInTheDocument();
            expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();

            // Hacer logout
            await user.click(screen.getByText('Cerrar sesión'));

            // Estado final: no autenticado
            await waitFor(() => {
                expect(screen.queryByText('Ir al perfil')).not.toBeInTheDocument();
                expect(screen.getByLabelText('Perfil / Iniciar sesión')).toBeInTheDocument();
                expect(mockPush).toHaveBeenCalledWith('/');
                expect(mockRefresh).toHaveBeenCalled();
            });
        });
    });

    describe('Flujo de conversión de roles', () => {
        it('debe completar flujo: guest -> convertir a host -> ambos roles', async () => {
            const user = userEvent.setup();

            // Setup: usuario guest autenticado
            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('userName', 'Guest User');
            localStorage.setItem('roles', JSON.stringify(['guest']));
            localStorage.setItem('userId', 'user-123');
            useAuthStore.setState({ token: 'test-token', name: 'Guest User' });

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ roles: ['guest', 'host'] }),
            });

            render(<Navbar onSearch={mockOnSearch} />);

            // Estado inicial: solo guest
            expect(screen.getByText('Convertirme en anfitrión')).toBeInTheDocument();
            expect(screen.queryByText('Crear listing')).not.toBeInTheDocument();

            // Convertir a host
            await user.click(screen.getByText('Convertirme en anfitrión'));

            // Estado final: guest + host
            await waitFor(() => {
                expect(fetchMock).toHaveBeenCalledWith(
                    'http://localhost:3000/auth/user-123',
                    expect.objectContaining({
                        method: 'PATCH',
                        body: JSON.stringify({ roles: ['guest', 'host'] }),
                    })
                );
            });

            await waitFor(() => {
                const roles = JSON.parse(localStorage.getItem('roles') || '[]');
                expect(roles).toContain('guest');
                expect(roles).toContain('host');
            });
        });

        it('debe completar flujo: host -> cambiar a vista guest -> volver a host', async () => {
            const user = userEvent.setup();

            // Setup: usuario con ambos roles
            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('roles', JSON.stringify(['guest', 'host']));
            localStorage.setItem('viewAs', 'host');
            localStorage.setItem('userId', 'user-123');
            useAuthStore.setState({ token: 'test-token' });

            render(<Navbar onSearch={mockOnSearch} />);

            // Estado inicial: vista host
            expect(screen.getByText('Ver como anfitrión')).toHaveClass('bg-white', 'text-black');
            expect(screen.getByText('Crear listing')).toBeInTheDocument();

            // Cambiar a vista guest
            await user.click(screen.getByText('Ver como huésped'));

            await waitFor(() => {
                expect(localStorage.getItem('viewAs')).toBe('guest');
                const guestButton = screen.getByText('Ver como huésped');
                expect(guestButton).toHaveClass('bg-white', 'text-black');
            });

            // Volver a vista host
            await user.click(screen.getByText('Ver como anfitrión'));

            await waitFor(() => {
                expect(localStorage.getItem('viewAs')).toBe('host');
                const hostButton = screen.getByText('Ver como anfitrión');
                expect(hostButton).toHaveClass('bg-white', 'text-black');
            });
        });

        it('debe completar flujo: no autenticado -> signup como host -> crear listing', async () => {
            const user = userEvent.setup();
            const mockPush = vi.fn();
            vi.mocked(require('next/navigation').useRouter).mockReturnValue({
                push: mockPush,
                replace: vi.fn(),
                refresh: vi.fn(),
            });

            render(<Navbar onSearch={mockOnSearch} />);

            // Paso 1: Click en "Convertirme en anfitrión" sin estar autenticado
            await user.click(screen.getByText('Convertirme en anfitrión'));

            // Debe establecer signupRole
            expect(localStorage.getItem('signupRole')).toBe('host');

            // Debe abrir modal
            await waitFor(() => {
                expect(screen.getByTestId('host-auth-modal')).toBeInTheDocument();
            });

            // Paso 2: Hacer login/signup (simulado)
            const mockLoginWithHostRole = async () => {
                localStorage.setItem('authToken', 'test-token');
                localStorage.setItem('userName', 'New Host');
                localStorage.setItem('roles', JSON.stringify(['host']));
                localStorage.setItem('userId', 'user-456');
                useAuthStore.setState({ token: 'test-token', name: 'New Host' });
            };

            await mockLoginWithHostRole();
            await user.click(screen.getByText('Close Modal'));

            // Re-render para actualizar estado
            render(<Navbar onSearch={mockOnSearch} />);

            // Paso 3: Debe poder crear listing
            await waitFor(() => {
                expect(screen.getByText('Crear listing')).toBeInTheDocument();
            });

            await user.click(screen.getByText('Crear listing'));

            expect(mockPush).toHaveBeenCalledWith('/listing/new');
        });
    });

    describe('Manejo de múltiples usuarios y sesiones', () => {
        it('debe limpiar completamente la sesión anterior al hacer logout', async () => {
            const user = userEvent.setup();

            // Sesión del usuario 1
            localStorage.setItem('authToken', 'token-user1');
            localStorage.setItem('userName', 'User One');
            localStorage.setItem('userId', 'user-1');
            localStorage.setItem('roles', JSON.stringify(['host']));
            localStorage.setItem('userData', JSON.stringify({ id: 'user-1', name: 'User One' }));
            localStorage.setItem('viewAs', 'host');
            useAuthStore.setState({ token: 'token-user1', name: 'User One' });

            const { rerender } = render(<Navbar onSearch={mockOnSearch} />);

            // Verificar estado usuario 1
            expect(screen.getByText('User One')).toBeInTheDocument();
            expect(screen.getByText('Ver como anfitrión')).toBeInTheDocument();

            // Logout
            await user.click(screen.getByText('Cerrar sesión'));

            await waitFor(() => {
                expect(localStorage.getItem('authToken')).toBeNull();
                expect(localStorage.getItem('userName')).toBeNull();
                expect(localStorage.getItem('userId')).toBeNull();
                expect(localStorage.getItem('roles')).toBeNull();
                expect(localStorage.getItem('userData')).toBeNull();
                expect(localStorage.getItem('viewAs')).toBeNull();
            });

            // Login de usuario 2
            localStorage.setItem('authToken', 'token-user2');
            localStorage.setItem('userName', 'User Two');
            localStorage.setItem('userId', 'user-2');
            localStorage.setItem('roles', JSON.stringify(['guest']));
            useAuthStore.setState({ token: 'token-user2', name: 'User Two' });

            rerender(<Navbar onSearch={mockOnSearch} />);

            // No debe quedar rastro del usuario 1
            await waitFor(() => {
                expect(screen.queryByText('User One')).not.toBeInTheDocument();
                expect(screen.getByText('User Two')).toBeInTheDocument();
                expect(screen.queryByText('Ver como anfitrión')).not.toBeInTheDocument();
                expect(screen.getByText('Ver como huésped')).toBeInTheDocument();
            });
        });

        it('debe mantener consistencia entre tabs/ventanas con localStorage events', async () => {
            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('roles', JSON.stringify(['guest']));
            useAuthStore.setState({ token: 'test-token' });

            const { rerender } = render(<Navbar onSearch={mockOnSearch} />);

            // Simular cambio en otra tab/ventana
            localStorage.setItem('roles', JSON.stringify(['guest', 'host']));

            // Disparar evento de storage (como si viniera de otra tab)
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'roles',
                newValue: JSON.stringify(['guest', 'host']),
                oldValue: JSON.stringify(['guest']),
                url: window.location.href,
            }));

            // El componente debe actualizarse
            await waitFor(() => {
                expect(screen.getByText('Ver como anfitrión')).toBeInTheDocument();
            });
        });
    });

    describe('Interacción compleja con API', () => {
        it('debe manejar múltiples llamadas a API durante conversión de roles', async () => {
            const user = userEvent.setup();

            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('userId', 'user-123');
            localStorage.setItem('roles', JSON.stringify([]));
            useAuthStore.setState({ token: 'test-token' });

            // Primera llamada falla
            fetchMock
                .mockResolvedValueOnce({
                    ok: false,
                    status: 400,
                    text: async () => 'Cannot add role',
                })
                // Segunda llamada (fallback) exitosa
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ roles: ['host'] }),
                });

            render(<Navbar onSearch={mockOnSearch} />);

            await user.click(screen.getByText('Convertirme en anfitrión'));

            await waitFor(() => {
                expect(fetchMock).toHaveBeenCalledTimes(2);
            });

            // Debe terminar con rol de host
            await waitFor(() => {
                const roles = JSON.parse(localStorage.getItem('roles') || '[]');
                expect(roles).toContain('host');
            });
        });

        it('debe manejar timeout en API y permitir reintentos', async () => {
            const user = userEvent.setup();

            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('userId', 'user-123');
            localStorage.setItem('roles', JSON.stringify(['guest']));
            useAuthStore.setState({ token: 'test-token' });

            // Simular timeout
            fetchMock.mockImplementationOnce(() =>
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 100)
                )
            );

            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            render(<Navbar onSearch={mockOnSearch} />);

            await user.click(screen.getByText('Convertirme en anfitrión'));

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalled();
            }, { timeout: 200 });

            // Setup para reintento exitoso
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ roles: ['guest', 'host'] }),
            });

            // Reintentar
            await user.click(screen.getByText('Convertirme en anfitrión'));

            await waitFor(() => {
                expect(fetchMock).toHaveBeenCalledTimes(2);
            });

            consoleErrorSpy.mockRestore();
        });

        it('debe sincronizar estado con backend después de cada cambio de rol', async () => {
            const user = userEvent.setup();
            const mockRefresh = vi.fn();
            vi.mocked(require('next/navigation').useRouter).mockReturnValue({
                push: vi.fn(),
                replace: vi.fn(),
                refresh: mockRefresh,
            });

            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('userId', 'user-123');
            localStorage.setItem('roles', JSON.stringify(['guest']));
            useAuthStore.setState({ token: 'test-token' });

            render(<Navbar onSearch={mockOnSearch} />);

            await user.click(screen.getByText('Convertirme en anfitrión'));

            await waitFor(() => {
                expect(fetchMock).toHaveBeenCalled();
                expect(mockRefresh).toHaveBeenCalled();
            });
        });
    });

    describe('Navegación y redirección compleja', () => {
        it('debe redirigir correctamente después de login con postLoginRedirect', async () => {
            const user = userEvent.setup();
            const mockPush = vi.fn();
            vi.mocked(require('next/navigation').useRouter).mockReturnValue({
                push: mockPush,
                replace: vi.fn(),
                refresh: vi.fn(),
            });

            // Establecer redirect pendiente
            localStorage.setItem('postLoginRedirect', '/listing/123');

            render(<Navbar onSearch={mockOnSearch} />);

            // Abrir modal y hacer login
            await user.click(screen.getByLabelText('Perfil / Iniciar sesión'));

            await waitFor(() => {
                expect(screen.getByTestId('host-auth-modal')).toBeInTheDocument();
            });

            await user.click(screen.getByText('Mock Login'));

            // Debe limpiar postLoginRedirect
            await waitFor(() => {
                expect(localStorage.getItem('postLoginRedirect')).toBeNull();
            });
        });

        it('debe mantener la página actual después de cambiar roles', async () => {
            const user = userEvent.setup();
            const mockPush = vi.fn();
            const mockRefresh = vi.fn();
            const mockPathname = vi.fn(() => '/profile');

            vi.mocked(require('next/navigation').useRouter).mockReturnValue({
                push: mockPush,
                replace: vi.fn(),
                refresh: mockRefresh,
            });
            vi.mocked(require('next/navigation').usePathname).mockImplementation(mockPathname);

            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('userId', 'user-123');
            localStorage.setItem('roles', JSON.stringify(['guest', 'host']));
            localStorage.setItem('viewAs', 'guest');
            useAuthStore.setState({ token: 'test-token' });

            render(<Navbar onSearch={mockOnSearch} />);

            // Cambiar vista
            await user.click(screen.getByText('Ver como anfitrión'));

            await waitFor(() => {
                // No debe navegar a otra página
                expect(mockPush).not.toHaveBeenCalled();
                // Solo refrescar la página actual
                expect(mockRefresh).toHaveBeenCalled();
            });
        });
    });

    describe('Estado de UI y feedback al usuario', () => {
        it('debe mostrar estado de carga durante operaciones de API', async () => {
            const user = userEvent.setup();

            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('userId', 'user-123');
            localStorage.setItem('roles', JSON.stringify(['guest']));
            useAuthStore.setState({ token: 'test-token' });

            // Hacer que el fetch tarde
            fetchMock.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve({
                    ok: true,
                    json: async () => ({ roles: ['guest', 'host'] }),
                }), 100))
            );

            render(<Navbar onSearch={mockOnSearch} />);

            const convertButton = screen.getByText('Convertirme en anfitrión');
            await user.click(convertButton);

            // Durante la carga, el botón debe estar deshabilitado
            await waitFor(() => {
                expect(convertButton).toBeDisabled();
                expect(convertButton).toHaveClass('opacity-60');
            });

            // Después de completar, debe volver a estar habilitado
            await waitFor(() => {
                expect(convertButton).not.toBeDisabled();
            }, { timeout: 200 });
        });

        it('debe actualizar UI inmediatamente después de cambios locales', async () => {
            const user = userEvent.setup();

            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('roles', JSON.stringify(['guest', 'host']));
            localStorage.setItem('viewAs', 'guest');
            useAuthStore.setState({ token: 'test-token' });

            render(<Navbar onSearch={mockOnSearch} />);

            const guestButton = screen.getByText('Ver como huésped');
            expect(guestButton).toHaveClass('bg-white', 'text-black');

            // Cambiar vista
            await user.click(screen.getByText('Ver como anfitrión'));

            // UI debe actualizarse inmediatamente
            const hostButton = screen.getByText('Ver como anfitrión');
            expect(hostButton).toHaveClass('bg-white', 'text-black');

            const guestButtonAfter = screen.getByText('Ver como huésped');
            expect(guestButtonAfter).not.toHaveClass('bg-white', 'text-black');
        });
    });

    describe('Persistencia y recuperación de estado', () => {
        it('debe restaurar estado de usuario al recargar página', () => {
            // Simular estado guardado
            localStorage.setItem('authToken', 'persisted-token');
            localStorage.setItem('userName', 'Persisted User');
            localStorage.setItem('roles', JSON.stringify(['host']));
            localStorage.setItem('viewAs', 'host');
            localStorage.setItem('userId', 'user-789');

            // Simular recarga (nuevo render sin estado previo)
            useAuthStore.setState({
                token: null,
                name: '',
            });

            render(<Navbar onSearch={mockOnSearch} />);

            // Debe cargar el estado desde localStorage
            expect(screen.getByText('Ir al perfil')).toBeInTheDocument();
            expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
            expect(screen.getByText('Ver como anfitrión')).toBeInTheDocument();
        });

        it('debe sincronizar Zustand store con localStorage en mount', () => {
            localStorage.setItem('authToken', 'stored-token');
            localStorage.setItem('userName', 'Stored User');

            render(<Navbar onSearch={mockOnSearch} />);

            const state = useAuthStore.getState();
            expect(state.token).toBe('stored-token');
            expect(state.name).toBe('Stored User');
        });
    });
});