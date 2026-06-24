# Historias de Usuario y Épicas

## EP-001 – Login y gestión de acceso

**Estado:** Terminado

**Prioridad:** Alta

**Puntos totales:** 17 pts

### Descripción

Permite que clientes, empresas y administradores se registren, inicien sesión y gestionen el acceso a la plataforma según su rol. Es la épica base del sistema, ya que ninguna otra funcionalidad es accesible sin una sesión válida.

### Historias de usuario

| ID     | Historia             | Prioridad | Puntos | Estado    |
| ------ | -------------------- | --------- | ------ | --------- |
| HU-001 | Registro de usuario  | Alta      | 5 pts  | Terminado |
| HU-002 | Inicio de sesión     | Alta      | 5 pts  | Terminado |
| HU-019 | Cerrar sesión        | Alta      | 2 pts  | Terminado |
| HU-020 | Recuperar contraseña | Alta      | 5 pts  | Terminado (Oculto en UI) |

### Criterios de aceptación de la épica

* Los tres roles (cliente, empresa y administrador) pueden registrarse e iniciar sesión.
* Las rutas protegidas no son accesibles sin una sesión activa.
* Cada rol accede únicamente a las funcionalidades que le corresponden.
* Las contraseñas se almacenan de forma encriptada.

### Documentación técnica relacionada

* Arquitectura y API.
* Seguridad y control de acceso.

---

## EP-002 – Gestión de formularios de adopción

**Estado:** Implementada

**Prioridad:** Alta

**Puntos totales:** 21 pts

### Descripción

Cubre el flujo central de adopción: el cliente envía una solicitud, la empresa la revisa y toma una decisión, mientras que el estado de la mascota se actualiza según el resultado del proceso.

### Historias de usuario

| ID     | Historia                        | Prioridad | Puntos | Estado    |
| ------ | ------------------------------- | --------- | ------ | --------- |
| HU-003 | Publicar mascota en adopción    | Alta      | 5 pts  | Terminado |
| HU-004 | Postulación para adopción       | Alta      | 5 pts  | Terminado |
| HU-005 | Revisar solicitudes de adopción | Alta      | 5 pts  | Terminado |
| HU-007 | Actualizar estado de mascota    | Media     | 3 pts  | Terminado |
| HU-011 | Editar información de mascota   | Media     | 3 pts  | Terminado |

### Criterios de aceptación de la épica

* La empresa puede publicar, editar y actualizar el estado de sus mascotas.
* El cliente puede enviar una solicitud de adopción para una mascota disponible.
* La empresa puede aprobar o rechazar solicitudes desde su panel.
* Las mascotas adoptadas no aparecen como disponibles dentro del catálogo.

### Documentación técnica relacionada

* Arquitectura y API.
* Seguridad y control de acceso.

---

## EP-003 – Gestión de animales y catálogo

**Estado:** Parcial (60%)

**Prioridad:** Alta

**Puntos totales:** 18 pts

### Descripción

Agrupa las funcionalidades relacionadas con la exploración del catálogo por parte del cliente, permitiendo visualizar mascotas, consultar detalles, aplicar filtros, realizar búsquedas, guardar favoritos y gestionar su perfil.

### Historias de usuario

| ID     | Historia                    | Prioridad | Puntos | Estado    |
| ------ | --------------------------- | --------- | ------ | --------- |
| HU-008 | Ver catálogo de mascotas    | Alta      | 3 pts  | Terminado |
| HU-009 | Ver detalle de una mascota  | Alta      | 3 pts  | Terminado |
| HU-010 | Filtrar mascotas            | Media     | 3 pts  | Pendiente |
| HU-015 | Gestionar perfil de usuario | Media     | 3 pts  | Pendiente |
| HU-016 | Guardar mascotas favoritas  | Media     | 3 pts  | Pendiente |
| HU-017 | Buscar mascotas             | Media     | 3 pts  | Pendiente |

### Criterios de aceptación de la épica

* El cliente puede navegar por el catálogo y consultar el detalle de cada mascota.
* El cliente puede filtrar y buscar mascotas según diferentes características.
* El cliente puede guardar mascotas en favoritos para consultarlas posteriormente.
* El cliente puede modificar su información personal desde el perfil.

### Documentación técnica relacionada

* Arquitectura y API.
* Frontend y diseño responsivo.

---

## EP-004 – Panel de administración y control del sistema

**Estado:** Pendiente

**Prioridad:** Media

**Puntos totales:** 18 pts

### Descripción

Permite al administrador supervisar y administrar los distintos elementos de la plataforma, incluyendo usuarios, empresas y publicaciones, garantizando el correcto funcionamiento, seguridad y control general de AdoptMe.

### Historias de usuario

| ID     | Historia                             | Prioridad | Puntos | Estado    |
| ------ | ------------------------------------ | --------- | ------ | --------- |
| HU-018 | Visualizar estadísticas generales    | Media     | 3 pts  | Pendiente |
| HU-021 | Gestionar usuarios registrados       | Alta      | 5 pts  | Pendiente |
| HU-022 | Gestionar empresas registradas       | Alta      | 5 pts  | Pendiente |
| HU-023 | Supervisar publicaciones de mascotas | Media     | 3 pts  | Pendiente |
| HU-024 | Gestionar reportes y sanciones       | Baja      | 2 pts  | Pendiente |

### Criterios de aceptación de la épica

* El administrador dispone de un panel exclusivo protegido por permisos de acceso.
* Puede consultar información general sobre la actividad de la plataforma.
* Puede administrar cuentas de usuarios y empresas cuando sea necesario.
* Puede supervisar las publicaciones de mascotas dentro del sistema.
* Las funciones administrativas están restringidas únicamente al rol administrador.

### Documentación técnica relacionada

* Arquitectura y API.
* Seguridad y control de acceso.
* Gestión de roles y permisos.
