import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAuthStore } from '@/app/stores/stores';
import Navbar from '../NavBar';

// Mock de SearchBar
vi.mock('@/app/components/navigation/SearchBar', () => ({
    SearchBar: ({ onSearch }: any) => (
        <div data-testid="search-bar">
            <button onClick={() => onSearch('test', '', '', 1, '', '', 0, [])}>
                Mock Search
            </button>
        </div>
    ),
}));

// Mock de HostAuthModal
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
                    onClose();
                }}>
                    Mock Login
                </button>
            </div>
        ) : null
    ),
}));

// Mock Font Awesome
vi.mock('font-awesome/css/font-awesome.min.css', () => ({}));

describe('Navbar Component', () => {
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
            json: async () => ({ roles: ['guest'] }),
        } as Response);
    });


    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Renderizado inicial', () => {
        it('debe renderizar el logo de StayLite', () => {
            render(<Navbar onSearch={mockOnSearch} />);

            const logo = screen.getByAltText('StayLite Logo');
            expect(logo).toBeInTheDocument();
            expect(logo).toHaveAttribute('src', '/logo.png');
        });

        it('debe renderizar los enlaces de navegación', () => {
            render(<Navbar onSearch={mockOnSearch} />);

            expect(screen.getByText('Alojamientos')).toBeInTheDocument();
            expect(screen.getByText('Experiencias')).toBeInTheDocument();
            expect(screen.getByText('Buen servicio')).toBeInTheDocument();
        });

        it('debe renderizar SearchBar cuando no está en página de listing', () => {
            render(<Navbar onSearch={mockOnSearch} />);

            expect(screen.getByTestId('search-bar')).toBeInTheDocument();
        });

        it('NO debe renderizar SearchBar cuando está en página de listing', () => {
            const mockPathname = vi.fn(() => '/listing/123');
            vi.mocked(require('next/navigation').usePathname).mockImplementation(mockPathname);

            render(<Navbar onSearch={mockOnSearch} />);

            expect(screen.queryByTestId('search-bar')).not.toBeInTheDocument();
        });

        it('debe mostrar botones de autenticación cuando no está autenticado', () => {
            render(<Navbar onSearch={mockOnSearch} />);

            expect(screen.getByText('Convertirme en anfitrión')).toBeInTheDocument();
            expect(screen.getByLabelText('Perfil / Iniciar sesión')).toBeInTheDocument();
        });

        it('NO debe mostrar "Ir al perfil" cuando no está autenticado', () => {
            render(<Navbar onSearch={mockOnSearch} />);

            expect(screen.queryByText('Ir al perfil')).not.toBeInTheDocument();
        });
    });

    describe('Estado autenticado', () => {
        beforeEach(() => {
            // Simular usuario autenticado
            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('userName', 'John Doe');
            localStorage.setItem('roles', JSON.stringify(['guest']));

            useAuthStore.setState({
                token: 'test-token',
                name: 'John Doe',
            });
        });

        it('debe mostrar botón "Ir al perfil" cuando está autenticado', () => {
            render(<Navbar onSearch={mockOnSearch} />);

            expect(screen.getByText('Ir al perfil')).toBeInTheDocument();
        });

        it('debe mostrar botón "Cerrar sesión" cuando está autenticado', () => {
            render(<Navbar onSearch={mockOnSearch} />);

            expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();
        });

        it('debe mostrar "Convertirme en anfitrión" si solo es guest', () => {
            render(<Navbar onSearch={mockOnSearch} />);

            expect(screen.getByText('Convertirme en anfitrión')).toBeInTheDocument();
        });

        it('NO debe mostrar botón de login cuando está autenticado', () => {
            render(<Navbar onSearch={mockOnSearch} />);

            expect(screen.queryByLabelText('Perfil / Iniciar sesión')).not.toBeInTheDocument();
        });
    });

    describe('Roles de usuario - Host', () => {
        beforeEach(() => {
            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('userName', 'Host User');
            localStorage.setItem('roles', JSON.stringify(['host']));
            localStorage.setItem('viewAs', 'host');

            useAuthStore.setState({
                token: 'test-token',
                name: 'Host User',
            });
        });

        it('debe mostrar "Ver como anfitrión" cuando es host', () => {
            render(<Navbar onSearch={mockOnSearch} />);

            expect(screen.getByText('Ver como anfitrión')).toBeInTheDocument();
        });

        it('debe mostrar botón "Crear listing" cuando es host', () => {
            render(<Navbar onSearch={mockOnSearch} />);

            expect(screen.getByText('Crear listing')).toBeInTheDocument();
        });

        it('debe navegar a /listing/new al hacer clic en "Crear listing"', async () => {
            const user = userEvent.setup();
            const mockPush = vi.fn();
            vi.mocked(require('next/navigation').useRouter).mockReturnValue({
                push: mockPush,
                replace: vi.fn(),
                refresh: vi.fn(),
            });

            render(<Navbar onSearch={mockOnSearch} />);

            const createButton = screen.getByText('Crear listing');
            await user.click(createButton);

            expect(mockPush).toHaveBeenCalledWith('/listing/new');
        });

        it('debe resaltar "Ver como anfitrión" cuando viewAs es host', () => {
            render(<Navbar onSearch={mockOnSearch} />);

            const hostButton = screen.getByText('Ver como anfitrión');
            expect(hostButton).toHaveClass('bg-white', 'text-black');
        });
    });

    describe('Roles de usuario - Guest', () => {
        beforeEach(() => {
            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('userName', 'Guest User');
            localStorage.setItem('roles', JSON.stringify(['guest']));
            localStorage.setItem('viewAs', 'guest');

            useAuthStore.setState({
                token: 'test-token',
                name: 'Guest User',
            });
        });

        it('debe mostrar "Ver como huésped" cuando es guest', () => {
            render(<Navbar onSearch={mockOnSearch} />);

            expect(screen.getByText('Ver como huésped')).toBeInTheDocument();
        });

        it('debe resaltar "Ver como huésped" cuando viewAs es guest', () => {
            render(<Navbar onSearch={mockOnSearch} />);

            const guestButton = screen.getByText('Ver como huésped');
            expect(guestButton).toHaveClass('bg-white', 'text-black');
        });

        it('debe mostrar "Convertirme en anfitrión" si solo es guest', () => {
            render(<Navbar onSearch={mockOnSearch} />);

            expect(screen.getByText('Convertirme en anfitrión')).toBeInTheDocument();
        });
    });

    describe('Modal de autenticación', () => {
        it('debe abrir el modal al hacer clic en "Convertirme en anfitrión"', async () => {
            const user = userEvent.setup();
            render(<Navbar onSearch={mockOnSearch} />);

            const convertButton = screen.getByText('Convertirme en anfitrión');
            await user.click(convertButton);

            await waitFor(() => {
                expect(screen.getByTestId('host-auth-modal')).toBeInTheDocument();
            });
        });

        it('debe abrir el modal al hacer clic en el botón de usuario', async () => {
            const user = userEvent.setup();
            render(<Navbar onSearch={mockOnSearch} />);

            const userButton = screen.getByLabelText('Perfil / Iniciar sesión');
            await user.click(userButton);

            await waitFor(() => {
                expect(screen.getByTestId('host-auth-modal')).toBeInTheDocument();
            });
        });

        it('debe establecer signupRole como "host" al abrir modal desde "Convertirme en anfitrión"', async () => {
            const user = userEvent.setup();
            render(<Navbar onSearch={mockOnSearch} />);

            const convertButton = screen.getByText('Convertirme en anfitrión');
            await user.click(convertButton);

            expect(localStorage.getItem('signupRole')).toBe('host');
        });

        it('debe cerrar el modal al hacer clic en "Close Modal"', async () => {
            const user = userEvent.setup();
            render(<Navbar onSearch={mockOnSearch} />);

            const userButton = screen.getByLabelText('Perfil / Iniciar sesión');
            await user.click(userButton);

            await waitFor(() => {
                expect(screen.getByTestId('host-auth-modal')).toBeInTheDocument();
            });

            const closeButton = screen.getByText('Close Modal');
            await user.click(closeButton);

            await waitFor(() => {
                expect(screen.queryByTestId('host-auth-modal')).not.toBeInTheDocument();
            });
        });

        it('debe actualizar el estado al hacer login exitoso', async () => {
            const user = userEvent.setup();
            render(<Navbar onSearch={mockOnSearch} />);

            const userButton = screen.getByLabelText('Perfil / Iniciar sesión');
            await user.click(userButton);

            const loginButton = screen.getByText('Mock Login');
            await user.click(loginButton);

            await waitFor(() => {
                expect(localStorage.getItem('authToken')).toBe('test-token');
                expect(localStorage.getItem('userName')).toBe('Test User');
            });
        });

        it('debe abrir modal con parámetro de URL authOpen=1', () => {
            const mockSearchParams = {
                get: vi.fn((key: string) => {
                    if (key === 'authOpen') return '1';
                    if (key === 'tab') return 'login';
                    return null;
                }),
            };
            vi.mocked(require('next/navigation').useSearchParams).mockReturnValue(mockSearchParams);

            render(<Navbar onSearch={mockOnSearch} />);

            expect(screen.getByTestId('host-auth-modal')).toBeInTheDocument();
        });
    });

    describe('Funcionalidad de logout', () => {
        beforeEach(() => {
            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('userName', 'John Doe');
            localStorage.setItem('roles', JSON.stringify(['guest']));
            localStorage.setItem('userData', JSON.stringify({ name: 'John Doe' }));

            useAuthStore.setState({
                token: 'test-token',
                name: 'John Doe',
            });
        });

        it('debe limpiar localStorage al hacer logout', async () => {
            const user = userEvent.setup();
            render(<Navbar onSearch={mockOnSearch} />);

            const logoutButton = screen.getByText('Cerrar sesión');
            await user.click(logoutButton);

            await waitFor(() => {
                expect(localStorage.getItem('authToken')).toBeNull();
                expect(localStorage.getItem('userName')).toBeNull();
                expect(localStorage.getItem('roles')).toBeNull();
            });
        });

        it('debe limpiar el estado de Zustand al hacer logout', async () => {
            const user = userEvent.setup();
            render(<Navbar onSearch={mockOnSearch} />);

            const logoutButton = screen.getByText('Cerrar sesión');
            await user.click(logoutButton);

            await waitFor(() => {
                const state = useAuthStore.getState();
                expect(state.token).toBeNull();
                expect(state.name).toBe('');
            });
        });

        it('debe redirigir a home después de logout', async () => {
            const user = userEvent.setup();
            const mockPush = vi.fn();
            const mockRefresh = vi.fn();
            vi.mocked(require('next/navigation').useRouter).mockReturnValue({
                push: mockPush,
                replace: vi.fn(),
                refresh: mockRefresh,
            });

            render(<Navbar onSearch={mockOnSearch} />);

            const logoutButton = screen.getByText('Cerrar sesión');
            await user.click(logoutButton);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/');
                expect(mockRefresh).toHaveBeenCalled();
            });
        });

        it('debe disparar evento auth:updated después de logout', async () => {
            const user = userEvent.setup();
            const eventSpy = vi.fn();
            window.addEventListener('auth:updated', eventSpy);

            render(<Navbar onSearch={mockOnSearch} />);

            const logoutButton = screen.getByText('Cerrar sesión');
            await user.click(logoutButton);

            await waitFor(() => {
                expect(eventSpy).toHaveBeenCalled();
            });

            window.removeEventListener('auth:updated', eventSpy);
        });
    });

    describe('Navegación al perfil', () => {
        it('debe abrir modal de login si no está autenticado', async () => {
            const user = userEvent.setup();
            render(<Navbar onSearch={mockOnSearch} />);

            // Primero hacemos login para que aparezca el botón
            const userButton = screen.getByLabelText('Perfil / Iniciar sesión');
            await user.click(userButton);
            const loginButton = screen.getByText('Mock Login');
            await user.click(loginButton);

            // Ahora debe aparecer el botón de perfil
            await waitFor(() => {
                expect(screen.getByText('Ir al perfil')).toBeInTheDocument();
            });
        });

        it('debe navegar a /profile cuando está autenticado', async () => {
            const user = userEvent.setup();
            const mockPush = vi.fn();
            vi.mocked(require('next/navigation').useRouter).mockReturnValue({
                push: mockPush,
                replace: vi.fn(),
                refresh: vi.fn(),
            });

            localStorage.setItem('authToken', 'test-token');
            useAuthStore.setState({ token: 'test-token' });

            render(<Navbar onSearch={mockOnSearch} />);

            const profileButton = screen.getByText('Ir al perfil');
            await user.click(profileButton);

            expect(mockPush).toHaveBeenCalledWith('/profile');
        });
    });

    describe('Cambio de roles', () => {
        beforeEach(() => {
            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('userName', 'User');
            useAuthStore.setState({ token: 'test-token', name: 'User' });
        });

        it('debe llamar a la API para agregar rol de host', async () => {
            const user = userEvent.setup();
            localStorage.setItem('roles', JSON.stringify(['guest']));
            localStorage.setItem('userId', 'user-123');

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ roles: ['guest', 'host'] }),
            });

            render(<Navbar onSearch={mockOnSearch} />);

            const convertButton = screen.getByText('Convertirme en anfitrión');
            await user.click(convertButton);

            await waitFor(() => {
                expect(fetchMock).toHaveBeenCalledWith(
                    'http://localhost:3000/auth/user-123',
                    expect.objectContaining({
                        method: 'PATCH',
                        body: JSON.stringify({ roles: ['guest', 'host'] }),
                    })
                );
            });
        });

        it('debe actualizar localStorage con nuevos roles', async () => {
            const user = userEvent.setup();
            localStorage.setItem('roles', JSON.stringify(['guest']));
            localStorage.setItem('userId', 'user-123');

            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ roles: ['guest', 'host'] }),
            });

            render(<Navbar onSearch={mockOnSearch} />);

            const convertButton = screen.getByText('Convertirme en anfitrión');
            await user.click(convertButton);

            await waitFor(() => {
                const roles = JSON.parse(localStorage.getItem('roles') || '[]');
                expect(roles).toContain('host');
            });
        });

        it('debe disparar eventos de cambio de rol', async () => {
            const user = userEvent.setup();
            localStorage.setItem('roles', JSON.stringify(['host']));
            localStorage.setItem('userId', 'user-123');

            const roleChangedSpy = vi.fn();
            const viewChangedSpy = vi.fn();
            window.addEventListener('role:changed', roleChangedSpy);
            window.addEventListener('view:changed', viewChangedSpy);

            render(<Navbar onSearch={mockOnSearch} />);

            const hostButton = screen.getByText('Ver como anfitrión');
            await user.click(hostButton);

            await waitFor(() => {
                expect(roleChangedSpy).toHaveBeenCalled();
                expect(viewChangedSpy).toHaveBeenCalled();
            });

            window.removeEventListener('role:changed', roleChangedSpy);
            window.removeEventListener('view:changed', viewChangedSpy);
        });

        it('debe manejar error al cambiar roles', async () => {
            const user = userEvent.setup();
            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });

            localStorage.setItem('roles', JSON.stringify(['guest']));
            localStorage.setItem('userId', 'user-123');

            fetchMock.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Server error',
            });

            render(<Navbar onSearch={mockOnSearch} />);

            const convertButton = screen.getByText('Convertirme en anfitrión');
            await user.click(convertButton);

            // Debe intentar reemplazar con solo host
            await waitFor(() => {
                expect(fetchMock).toHaveBeenCalledTimes(2);
            });

            alertSpy.mockRestore();
        });

        it('debe deshabilitar botones durante pending state', async () => {
            const user = userEvent.setup();
            localStorage.setItem('roles', JSON.stringify(['guest']));
            localStorage.setItem('userId', 'user-123');

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

            // Verificar que el botón está deshabilitado
            expect(convertButton).toHaveClass('opacity-60', 'cursor-not-allowed');
        });
    });

    describe('Integración con SearchBar', () => {
        it('debe pasar la función onSearch al SearchBar', () => {
            render(<Navbar onSearch={mockOnSearch} />);

            const searchBar = screen.getByTestId('search-bar');
            expect(searchBar).toBeInTheDocument();
        });

        it('debe llamar onSearch cuando SearchBar realiza búsqueda', async () => {
            const user = userEvent.setup();
            render(<Navbar onSearch={mockOnSearch} />);

            const mockSearchButton = screen.getByText('Mock Search');
            await user.click(mockSearchButton);

            expect(mockOnSearch).toHaveBeenCalledWith('test', '', '', 1, '', '', 0, []);
        });
    });

    describe('Responsive behavior', () => {
        it('debe aplicar clase py-2 cuando está en página de listing', () => {
            const mockPathname = vi.fn(() => '/listing/123');
            vi.mocked(require('next/navigation').usePathname).mockImplementation(mockPathname);

            const { container } = render(<Navbar onSearch={mockOnSearch} />);

            const nav = container.querySelector('nav');
            expect(nav).toHaveClass('py-2');
        });

        it('debe aplicar clase py-1 cuando NO está en página de listing', () => {
            const { container } = render(<Navbar onSearch={mockOnSearch} />);

            const nav = container.querySelector('nav');
            expect(nav).toHaveClass('py-1');
        });
    });

    describe('Helpers de normalización de roles', () => {
        it('debe normalizar roles a lowercase', async () => {
            const user = userEvent.setup();
            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('roles', JSON.stringify(['Guest', 'HOST']));
            localStorage.setItem('userId', 'user-123');

            useAuthStore.setState({ token: 'test-token' });

            render(<Navbar onSearch={mockOnSearch} />);

            // Debe reconocer que tiene rol de host
            await waitFor(() => {
                expect(screen.getByText('Ver como anfitrión')).toBeInTheDocument();
            });
        });

        it('debe manejar roles como string separado por comas', async () => {
            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('roles', 'guest,host');

            useAuthStore.setState({ token: 'test-token' });

            render(<Navbar onSearch={mockOnSearch} />);

            await waitFor(() => {
                expect(screen.getByText('Ver como anfitrión')).toBeInTheDocument();
            });
        });

        it('debe extraer roles de userData si roles está vacío', () => {
            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('userData', JSON.stringify({ roles: ['host'] }));
            localStorage.removeItem('roles');

            useAuthStore.setState({ token: 'test-token' });

            render(<Navbar onSearch={mockOnSearch} />);

            expect(screen.getByText('Ver como anfitrión')).toBeInTheDocument();
        });
    });

    describe('Storage events', () => {
        it('debe actualizar roles cuando cambia localStorage', async () => {
            render(<Navbar onSearch={mockOnSearch} />);

            // Simular cambio en localStorage
            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('roles', JSON.stringify(['host']));

            // Disparar evento de storage
            window.dispatchEvent(new Event('storage'));

            await waitFor(() => {
                expect(screen.getByText('Ver como anfitrión')).toBeInTheDocument();
            });
        });

        it('debe actualizar cuando se dispara evento auth:updated', async () => {
            render(<Navbar onSearch={mockOnSearch} />);

            localStorage.setItem('authToken', 'test-token');
            localStorage.setItem('roles', JSON.stringify(['guest']));

            window.dispatchEvent(new Event('auth:updated'));

            await waitFor(() => {
                expect(screen.getByText('Ver como huésped')).toBeInTheDocument();
            });
        });
    });

    describe('Accesibilidad', () => {
        it('debe tener alt text en el logo', () => {
            render(<Navbar onSearch={mockOnSearch} />);

            const logo = screen.getByAltText('StayLite Logo');
            expect(logo).toBeInTheDocument();
        });

        it('debe tener aria-label en el botón de usuario', () => {
            render(<Navbar onSearch={mockOnSearch} />);

            expect(screen.getByLabelText('Perfil / Iniciar sesión')).toBeInTheDocument();
        });

        it('debe tener alt text en las imágenes de navegación', () => {
            render(<Navbar onSearch={mockOnSearch} />);

            expect(screen.getByAltText('Alojamientos')).toBeInTheDocument();
            expect(screen.getByAltText('Experiencias')).toBeInTheDocument();
            expect(screen.getByAltText('Buen servicio')).toBeInTheDocument();
        });

        it('todos los botones deben ser accesibles por teclado', async () => {
            const user = userEvent.setup();
            render(<Navbar onSearch={mockOnSearch} />);

            // Tab para navegar
            await user.tab();

            // El primer elemento enfocable debe ser el logo
            const logo = screen.getByAltText('StayLite Logo').closest('a');
            expect(logo).toHaveFocus();
        });
    });
});