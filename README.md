# AdoptMe - Plataforma de Adopción de Mascotas
## PrimerSprint

---

## Descripción del proyecto

**AdoptMe** es una plataforma web desarrollada con el objetivo de conectar personas interesadas en adoptar mascotas con empresas y refugios encargados de ofrecer animales en adopción.

La aplicación permite a los usuarios registrarse, iniciar sesión y acceder a funcionalidades personalizadas según su rol dentro del sistema. Las empresas pueden publicar mascotas, gestionar solicitudes de adopción y administrar sus publicaciones, mientras que los clientes pueden explorar el catálogo de mascotas y realizar solicitudes de adopción.

El proyecto fue desarrollado bajo la metodología ágil **Scrum**, utilizando una arquitectura moderna basada en un frontend desarrollado con **Next.js** y un backend como servicio mediante **Supabase**.

---

## Arquitectura del sistema

AdoptMe sigue una arquitectura cliente-servidor basada en tres componentes principales:

### Frontend
El frontend está desarrollado con **Next.js** utilizando **App Router**, JavaScript, CSS y componentes del lado del cliente.

**Se encarga de:**
*   Renderizar las interfaces de usuario.
*   Gestionar la navegación entre páginas.
*   Consumir los servicios de Supabase.
*   Validar formularios.
*   Controlar la experiencia del usuario según su rol.

**Tecnologías utilizadas:**
*   Next.js
*   JavaScript
*   CSS
*   HTML5

### Backend y lógica de negocio
El proyecto utiliza **Supabase** como Backend as a Service (BaaS), encargándose de gran parte de la lógica del servidor.

**Servicios utilizados:**
*   **Supabase Auth**
    *   Gestiona:
        *   Registro de usuarios.
        *   Inicio de sesión.
        *   Cierre de sesión.
        *   Recuperación de contraseña.
        *   Control de sesiones.
*   **API REST de Supabase**
    *   Permite realizar operaciones CRUD sobre las entidades principales del sistema:
        *   Usuarios.
        *   Empresas.
        *   Mascotas.
        *   Solicitudes de adopción.

La comunicación se realiza mediante el cliente oficial de Supabase configurado dentro de la carpeta `lib`.

### Base de datos
La base de datos se encuentra alojada en **PostgreSQL** mediante **Supabase**.

---

## Entidades principales

### Usuarios
Almacena la información de los clientes y administradores.
*   **Campos generales:**
    *   ID del usuario.
    *   Nombre.
    *   Correo electrónico.
    *   Contraseña encriptada mediante Supabase Auth.
    *   Rol dentro de la plataforma.

### Empresas
Contiene la información de los refugios o entidades encargadas de publicar mascotas.
*   **Información almacenada:**
    *   Datos de la empresa.
    *   Información de contacto.
    *   Mascotas publicadas.

### Mascotas
Contiene los animales disponibles para adopción.
*   **Información almacenada:**
    *   Nombre.
    *   Especie.
    *   Edad.
    *   Descripción.
    *   Estado de adopción.
    *   Imagen.
    *   Empresa responsable.

### Solicitudes de adopción
Registra las postulaciones realizadas por los usuarios.
*   **Incluye:**
    *   Usuario solicitante.
    *   Mascota solicitada.
    *   Estado de la solicitud.
    *   Fecha de creación.

---

## Gestión de roles

El sistema cuenta con tres roles principales:

### Cliente
*   **Puede:**
    *   Registrarse e iniciar sesión.
    *   Consultar el catálogo de mascotas.
    *   Ver detalles de cada mascota.
    *   Realizar solicitudes de adopción.
    *   Gestionar su información personal.

### Empresa
*   **Puede:**
    *   Gestionar su perfil empresarial.
    *   Publicar mascotas.
    *   Editar información de mascotas.
    *   Revisar solicitudes de adopción.
    *   Aprobar o rechazar solicitudes.
    *   Cambiar el estado de adopción de una mascota.

### Administrador
*   **Funciones en desarrollo:**
    *   Visualizar estadísticas del sistema.
    *   Gestionar usuarios registrados.
    *   Gestionar empresas.
    *   Supervisar publicaciones.
    *   Controlar el funcionamiento general de la plataforma.

---

## Estructura del proyecto

```text
ADOPTME/
│
├── app/                       # Páginas y rutas utilizando App Router de Next.js
│   ├── api/                   # Manejadores de rutas de la API (auth, user, mascotas, adopciones)
│   ├── mascotas/              # Catálogo y gestión de mascotas
│   ├── registro/              # Registro de usuarios
│   ├── layout.js              # Estructura principal de la aplicación
│   ├── page.js                # Página de inicio
│   └── globals.css            # Estilos globales
│
├── Docs/                      # Documentación del proyecto
│   ├── Epicas-Historias.md    # Definición de Épicas e Historias de Usuario
│   ├── Casos de uso
│   ├── Requerimientos
│   ├── Modelo entidad-relación
│   └── Otros documentos de apoyo
│
├── lib/                       # Servicios y configuración
│   ├── supabaseClient.js      # Cliente de Supabase para el navegador
│   ├── supabaseServer.js      # Configuración del lado del servidor
│   ├── isTestMode.js          # Configuración del entorno de pruebas
│   └── CRUD y lógica auxiliar
│
├── public/                    # Recursos estáticos
│   ├── logo.png               # Logotipo de la aplicación
│   └── íconos SVG             # Íconos vectoriales
│
├── package.json               # Dependencias del proyecto
├── next.config.mjs            # Configuración de Next.js
├── eslint.config.mjs          # Reglas de calidad de código
└── README.md                  # Documentación principal
```

---

## Pruebas y documentación de API

El proyecto incorpora documentación y pruebas de la API mediante Swagger, permitiendo visualizar y validar los servicios disponibles.

**Las pruebas realizadas incluyen:**
*   Verificación de autenticación.
*   Validación de operaciones CRUD.
*   Pruebas de acceso según roles.
*   Validación de respuestas del sistema.

---

## Instalación y ejecución local

### Requisitos previos
*   Node.js
*   npm
*   Cuenta y proyecto en Supabase

### 1. Clonar el repositorio
```bash
git clone https://github.com/Juanes15342/AdoptMe.git
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear un archivo `.env` en la raíz del proyecto (o `.env.local`) con las credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave
SUPABASE_SERVICE_ROLE_KEY=tu_clave_servicio_role
```

### 4. Ejecutar el servidor de desarrollo
```bash
npm run dev
```

La aplicación estará disponible en: [http://localhost:3000](http://localhost:3000)

---

## Estado actual del proyecto

Actualmente AdoptMe cuenta con funcionalidades implementadas de autenticación, gestión de mascotas y proceso de adopción.

**Funciones completadas:**
*   Registro e inicio de sesión por roles.
*   Publicación de mascotas.
*   Solicitudes de adopción.
*   Gestión del estado de adopción.
*   Visualización del catálogo.
*   Recuperación de contraseña (Lógica del backend y flujo de pantallas implementado; botón de inicio de flujo oculto en UI por el momento).

**Funciones pendientes:**
*   Filtros avanzados de búsqueda.
*   Gestión de favoritos.
*   Panel administrativo.
*   Funciones adicionales de perfil.

---

## Equipo de desarrollo

Proyecto desarrollado como parte del programa **Análisis y Desarrollo de Software (ADSO)** utilizando la metodología **Scrum**.

**Roles del equipo:**
*   Scrum Master.
*   Product Owner.
*   Equipo de desarrollo.
