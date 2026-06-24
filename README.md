# AdoptMe 🐾

AdoptMe es una plataforma web moderna diseñada para estructurar y centralizar los procesos de adopción de animales domésticos (perros y gatos). El objetivo es conectar de forma segura a adoptantes (clientes) con empresas, refugios y hogares de paso, garantizando un acompañamiento continuo que promueva la tenencia responsable y reduzca el abandono animal.

---

## 🚀 Características Clave

La plataforma cuenta con un sistema robusto de control de acceso y tres tipos de cuentas especializadas:

### 1. Gestión de Usuarios y Roles (EP-001)
*   **Registro e Inicio de Sesión**: Soporta registro de Adoptantes, Empresas y Administradores.
*   **Seguridad**: Encriptación de contraseñas en el servidor mediante `bcryptjs` e integración segura con Supabase.
*   **Control de Acceso**: Redirecciones automáticas e interfaces personalizadas basadas en el rol asignado al usuario.

### 2. Gestión de Animales y Catálogo (EP-003)
*   **Catálogo Público**: Listado dinámico de mascotas disponibles para adopción.
*   **Subida y Edición de Mascotas**: Las empresas y refugios pueden registrar mascotas con fotos (subida directa a Supabase Storage o enlace externo), edad, especie, raza y descripción.
*   **Control de Disponibilidad**: Modificaciones en tiempo real del estado de disponibilidad de cada mascota.

### 3. Gestión de Formularios y Verificación (EP-002)
*   **Solicitud de Adopción**: Los clientes pueden postularse rellenando un formulario con su teléfono, dirección y un mensaje de motivación.
*   **Verificación de Adoptantes (Empresas)**: Panel interactivo para las empresas donde pueden visualizar todas las solicitudes enviadas a sus mascotas, inspeccionar los datos de contacto del cliente y **Aprobar** o **Rechazar** las postulaciones.

### 4. Auditoría y Prevención de Fraudes (Administrador)
*   **Métricas de Plataforma**: Tarjetas de KPIs con el conteo de solicitudes totales, pendientes, aprobadas y rechazadas.
*   **Búsqueda y Filtros**: Filtrado avanzado de procesos por estado del trámite y nivel de riesgo.
*   **Motor Anti-Fraude**: Detección inteligente en tiempo real que levanta alertas automáticas cuando:
    *   Un número de teléfono es compartido por cuentas de correo electrónico distintas.
    *   Una dirección física es utilizada por múltiples adoptantes.
    *   Un usuario presenta un volumen inusual de solicitudes (Spam).
    *   El mensaje de presentación es sospechosamente corto u omitido.

---

## 🛠️ Stack Tecnológico

*   **Framework**: [Next.js](https://nextjs.org/) (App Router & Webpack)
*   **Librería UI**: [React](https://react.dev/)
*   **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
*   **Base de Datos / Backend**: [Supabase](https://supabase.com/) (Tablas: `usuarios`, `tipo_cuenta`, `mascotas`, `solicitudes_adopcion`)
*   **Seguridad**: Encriptación con `bcryptjs`

---

## 📁 Estructura del Proyecto

```text
AdoptMe/
├── Docs/               # Documentación oficial (Modelos ER, Requerimientos, HUs)
├── app/
│   ├── api/            # API Endpoints (Auth, Mascotas, Adopciones, Usuarios)
│   ├── components/     # Componentes compartidos (Navbar, Cards, Modales)
│   ├── dashboard/      # Paneles privados de Admin, Empresa y Usuario
│   ├── login/          # Vistas y lógica de inicio de sesión y registro
│   ├── mascotas/       # Catálogo público y fichas de detalle
│   ├── globals.css     # Estilos globales y tokens CSS
│   └── layout.js       # Layout principal de la app
├── lib/                # Configuración del Cliente y Servidor de Supabase
├── public/             # Recursos estáticos (Logos, imágenes)
├── package.json        # Dependencias y scripts del proyecto
└── README.md           # Documentación general de la aplicación
```

---

## ⚙️ Configuración y Arranque Local

Sigue estos pasos para levantar el entorno de desarrollo local:

### 1. Clonar el repositorio
```bash
git clone https://github.com/Juanes15342/AdoptMe.git
cd AdoptMe
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto y añade tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=tu-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key (opcional, para bypass de RLS en servidor)
```

### 4. Ejecutar el servidor de desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para interactuar con la aplicación.

---

## 📜 Flujo de Trabajo y Contribuciones

Para mantener la integridad y orden en el repositorio, sigue estas directrices:

1.  **Crear una rama para tu feature o bugfix**:
    ```bash
    git checkout -b feat/nombre-de-tu-caracteristica
    ```
2.  **Hacer commit de tus cambios**:
    ```bash
    git commit -m "feat: descripción de los cambios implementados"
    ```
3.  **Subir la rama al repositorio remoto**:
    ```bash
    git push -u origin feat/nombre-de-tu-caracteristica
    ```
4.  **Crear un Pull Request (PR)** en GitHub y esperar la revisión/aprobación de código correspondiente.
