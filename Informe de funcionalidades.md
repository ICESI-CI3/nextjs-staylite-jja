# Informe de Funcionalidades – Aplicación Web de Alquiler de Alojamientos

## 1. Introducción

El presente informe describe las funcionalidades implementadas en la aplicación web desarrollada como parte del proyecto de alquiler de alojamientos, inspirada en el modelo de **Airbnb**.

El propósito principal del sistema es permitir que los usuarios puedan **publicar, buscar, reservar y gestionar alojamientos** de manera sencilla, garantizando una experiencia fluida tanto para los **anfitriones (hosts)** como para los **viajeros (guests)**.

El desarrollo incluye un **backend propio** (API REST) y un **frontend** construido con **Next.js y React**, el cual consume los endpoints del servidor para ofrecer una interfaz dinámica, segura y responsiva.

---

## 2. Descripción General de la Aplicación

La aplicación permite dos tipos principales de usuarios:
- **Host**: puede crear, editar y administrar sus alojamientos, así como visualizar estadísticas de sus reservas.
- **Guest**: puede explorar los alojamientos disponibles, realizar reservas y consultar el historial de las mismas.

El sistema está compuesto por los siguientes módulos principales:

1. **Autenticación y Autorización**
2. **HomeFeed (listado de alojamientos)**
3. **Gestión de alojamientos (para hosts)**
4. **Sistema de Reservas y Pagos**
5. **Perfil de usuario (información, alojamientos y reservas)**
6. **Gestión global del estado**

Cada uno de estos módulos se detalla a continuación.

---

## 3. Funcionalidades Implementadas

### 3.1 Autenticación y Autorización

- **Inicio de sesión**: Los usuarios ingresan con su correo electrónico y contraseña. Al iniciar sesión correctamente, el backend responde con un **token JWT (JSON Web Token)**.
- **Registro**: El sistema permite crear una nueva cuenta, almacenando los datos básicos del usuario y su rol.
- **Autorización por rol**:
  - Los usuarios con rol **host** pueden acceder a funcionalidades de creación, gestión y análisis de alojamientos.
  - Los usuarios con rol **guest** pueden explorar y reservar alojamientos.
- **Persistencia de sesión**: El token JWT se guarda en **LocalStorage** y se utiliza para autenticar todas las peticiones posteriores al backend mediante el encabezado `Authorization: Bearer <token>`.

**Implementación técnica:**

```typescript
// Ejemplo simplificado de manejo de autenticación
const login = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  localStorage.setItem('token', data.token);
  set({ user: data.user });
};
```

El token es validado por el backend en cada solicitud, asegurando que solo los usuarios autorizados puedan acceder a sus recursos correspondientes.

---

### 3.2 HomeFeed – Listado de Alojamientos

Muestra todos los alojamientos activos disponibles en la plataforma.

Cada alojamiento presenta información básica:

- Imagen principal
- Título
- Ubicación
- Precio por noche
- Capacidad

El diseño es responsivo y utiliza renderizado dinámico mediante peticiones al backend.

**Características adicionales:**

- Skeletons de carga mientras se obtienen los datos.
- Manejo de errores ante fallas de conexión.
- Visualización optimizada con tarjetas reutilizables.

**Ejemplo de estructura de datos:**

```json
{
  "id": "1",
  "title": "Apartamento en el centro",
  "images": ["url1.jpg"],
  "pricePerNight": 120,
  "capacity": 3,
  "location": { "city": "Bogotá", "country": "Colombia" },
  "isActive": true
}
```

---

### 3.3 Creación y Gestión de Alojamientos (Host)

Los usuarios con rol de host pueden crear nuevos alojamientos desde su perfil.

El formulario incluye campos como:

- Título del alojamiento
- Descripción
- Precio por noche
- Ubicación
- Imágenes
- Capacidad, número de habitaciones, camas y baños

Tras enviar el formulario, se realiza una petición POST autenticada al backend con el token JWT.

**Ejemplo técnico:**

```typescript
const createLodging = async (lodgingData) => {
  const token = localStorage.getItem('token');
  await fetch(`${API_URL}/lodgings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(lodgingData)
  });
};
```

**Características:**

- Validación de campos antes del envío.
- Feedback visual sobre éxito o error.
- Actualización automática de la lista de alojamientos.

---

### 3.4 Sistema de Reservas y Pagos

Los usuarios guest pueden realizar una reserva desde la página de detalles de un alojamiento.

El proceso incluye la selección de fechas y número de personas, seguido por la creación de una orden de pago.

**Flujo general:**

1. El usuario selecciona un alojamiento y las fechas deseadas.
2. El sistema calcula el costo total (precio por noche × número de noches).
3. Se genera una orden de reserva en el backend.
4. El usuario es redirigido a la pasarela de pago (simulada o integrada).
5. Una vez confirmado el pago, el backend marca la reserva como confirmada.

**Ejemplo de flujo técnico simplificado:**

```typescript
const createReservation = async (lodgingId, reservationData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/reservations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ lodgingId, ...reservationData })
  });
  return await response.json();
};
```

**Funcionalidades adicionales:**

- Validación de disponibilidad del alojamiento antes de confirmar la reserva.
- Redirección automática al flujo de pago.
- Visualización de la reserva en el perfil del usuario guest.
- Notificación al host sobre nuevas reservas.

---

### 3.5 Perfil de Usuario

El perfil centraliza toda la información del usuario y su actividad en la plataforma.

**Para usuarios guest:**

- Visualización de información personal.
- Listado de reservas realizadas (pasadas y activas).
- Acceso a detalles de cada reserva (estado, fechas, alojamiento, valor pagado).

**Para usuarios host:**

- Visualización de alojamientos publicados.
- Acceso a edición o eliminación de un alojamiento.
- Panel de estadísticas:
  - Número de reservas por alojamiento.
  - Ingresos generados.
  - Tasa de ocupación aproximada.

El perfil se actualiza dinámicamente a partir del estado global administrado con Zustand.

---

## 4. Gestión del Estado

La aplicación utiliza **Zustand** para manejar el estado global de usuario, alojamientos y reservas.

Esta solución permite compartir estados entre componentes sin necesidad de estructuras complejas como Redux.

**Ventajas principales:**

- Sintaxis clara y liviana.
- Persistencia automática con LocalStorage.
- Reactividad instantánea.
- Facilidad para manejar tokens y datos del usuario logueado.

**Ejemplo de store con persistencia:**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user, token) => set({ user, token }),
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
    }),
    { name: 'auth-storage' } // guarda los datos en LocalStorage
  )
);
```

El mismo patrón se replica en los stores de reservas y alojamientos, permitiendo sincronización instantánea con la interfaz.

---

## 5. Conclusiones

El frontend desarrollado cumple con los requerimientos principales del proyecto al ofrecer:

- Flujo completo de autenticación y autorización basado en JWT.
- Gestión de estado eficiente y persistente con Zustand.
- Interfaz modular y dinámica que interactúa en tiempo real con el backend.
- Sistema de reservas y pagos que permite a los usuarios gestionar transacciones seguras.
- Paneles diferenciados por rol, ofreciendo a cada tipo de usuario las herramientas necesarias:
  - **Guest**: gestión de reservas y pagos.
  - **Host**: administración de alojamientos y estadísticas de desempeño.
- Base sólida para la incorporación de futuras funcionalidades como:
  - Filtros avanzados de búsqueda.
  - Sistema de calificaciones y reseñas.
  - Notificaciones en tiempo real.
  - Integración de pasarelas de pago reales.