/**
 * AdoptMe - Pruebas CRUD
 * Stack: Next.js API Routes + Supabase
 * Framework de pruebas: Jest + node-fetch 
 *
 * Ejecutar: npx jest adoptme.crud.test.js
 * Instalar deps: npm install --save-dev jest node-fetch
 */

const fetch = require("node-fetch");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

beforeAll(async () => {
  await fetch(`${BASE_URL}/api/crud-test/reset`, {
    method: "POST",
    headers: { "X-Crud-Test-Mode": "1" },
  });
});

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
async function req(method, path, body) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Crud-Test-Mode": "1",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  let data = null;
  try {
    data = await res.json();
  } catch (_) {}
  return { status: res.status, data };
}

// ─────────────────────────────────────────────
// 1. MASCOTAS  /api/mascotas  y  /api/mascotas/[id]
// ─────────────────────────────────────────────
describe("MASCOTAS", () => {
  let mascotaId;

  // CREATE
  describe("POST /api/mascotas", () => {
    test("Crea una mascota con datos válidos y retorna 201", async () => {
      const nueva = {
        nombre: "Firulais",
        especie: "perro",
        raza: "labrador",
        edad: 2,
        descripcion: "Muy juguetón",
        estado: "disponible",
      };
      const { status, data } = await req("POST", "/api/mascotas", nueva);
      expect(status).toBe(201);
      expect(data).toHaveProperty("id");
      expect(data.nombre).toBe("Firulais");
      mascotaId = data.id; // guardar para pruebas posteriores
    });

    test("Retorna 400 si falta el campo 'nombre'", async () => {
      const { status, data } = await req("POST", "/api/mascotas", {
        especie: "gato",
        edad: 1,
      });
      expect(status).toBe(400);
      expect(data).toHaveProperty("error");
    });

    test("Retorna 400 si 'especie' tiene un valor no permitido", async () => {
      const { status } = await req("POST", "/api/mascotas", {
        nombre: "Kiwi",
        especie: "dragon", // valor inválido
        edad: 3,
      });
      expect(status).toBe(400);
    });
  });

  // READ ALL
  describe("GET /api/mascotas", () => {
    test("Retorna un arreglo de mascotas con status 200", async () => {
      const { status, data } = await req("GET", "/api/mascotas");
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    test("Cada mascota en la lista tiene al menos id, nombre y estado", async () => {
      const { data } = await req("GET", "/api/mascotas");
      data.forEach((m) => {
        expect(m).toHaveProperty("id");
        expect(m).toHaveProperty("nombre");
        expect(m).toHaveProperty("estado");
      });
    });
  });

  // READ ONE
  describe("GET /api/mascotas/[id]", () => {
    test("Retorna la mascota correcta por id con status 200", async () => {
      const { status, data } = await req("GET", `/api/mascotas/${mascotaId}`);
      expect(status).toBe(200);
      expect(data.id).toBe(mascotaId);
    });

    test("Retorna 404 si la mascota no existe", async () => {
      const { status } = await req("GET", "/api/mascotas/id-inexistente-9999");
      expect(status).toBe(404);
    });
  });

  // UPDATE
  describe("PUT /api/mascotas/[id]", () => {
    test("Actualiza los datos de una mascota y retorna 200", async () => {
      const { status, data } = await req(
        "PUT",
        `/api/mascotas/${mascotaId}`,
        { nombre: "Firulais Actualizado", edad: 3 }
      );
      expect(status).toBe(200);
      expect(data.nombre).toBe("Firulais Actualizado");
      expect(data.edad).toBe(3);
    });

    test("Retorna 404 al intentar actualizar una mascota inexistente", async () => {
      const { status } = await req("PUT", "/api/mascotas/id-falso-999", {
        nombre: "Nadie",
      });
      expect(status).toBe(404);
    });

    test("Retorna 400 si el body está vacío", async () => {
      const { status } = await req("PUT", `/api/mascotas/${mascotaId}`, {});
      expect(status).toBe(400);
    });
  });

  // DELETE
  describe("DELETE /api/mascotas/[id]", () => {
    test("Elimina la mascota y retorna 200 o 204", async () => {
      const { status } = await req("DELETE", `/api/mascotas/${mascotaId}`);
      expect([200, 204]).toContain(status);
    });

    test("Retorna 404 al intentar eliminar una mascota ya eliminada", async () => {
      const { status } = await req("DELETE", `/api/mascotas/${mascotaId}`);
      expect(status).toBe(404);
    });
  });
});

// ─────────────────────────────────────────────
// 2. ADOPCIONES  /api/adopciones  y  /api/adopciones/[id]
// ─────────────────────────────────────────────
describe("ADOPCIONES", () => {
  let adopcionId;

  // CREATE
  describe("POST /api/adopciones", () => {
    test("Registra una solicitud de adopción y retorna 201", async () => {
      const solicitud = {
        mascota_id: "uuid-mascota-prueba",
        usuario_id: "uuid-usuario-prueba",
        mensaje: "Me gustaría adoptar a Firulais",
      };
      const { status, data } = await req("POST", "/api/adopciones", solicitud);
      expect(status).toBe(201);
      expect(data).toHaveProperty("id");
      adopcionId = data.id;
    });

    test("Retorna 400 si falta mascota_id o usuario_id", async () => {
      const { status } = await req("POST", "/api/adopciones", {
        mensaje: "Sin ids",
      });
      expect(status).toBe(400);
    });

    test("Retorna 409 si ya existe una adopción activa para esa mascota", async () => {
      const solicitud = {
        mascota_id: "uuid-mascota-ya-adoptada",
        usuario_id: "uuid-usuario-prueba",
        mensaje: "Quiero adoptarla también",
      };
      const { status } = await req("POST", "/api/adopciones", solicitud);
      expect(status).toBe(409);
    });
  });

  // READ ALL
  describe("GET /api/adopciones", () => {
    test("Retorna lista de adopciones con status 200", async () => {
      const { status, data } = await req("GET", "/api/adopciones");
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    test("Cada adopción tiene id, mascota_id, usuario_id y estado", async () => {
      const { data } = await req("GET", "/api/adopciones");
      if (data.length > 0) {
        expect(data[0]).toHaveProperty("id");
        expect(data[0]).toHaveProperty("mascota_id");
        expect(data[0]).toHaveProperty("usuario_id");
        expect(data[0]).toHaveProperty("estado");
      }
    });
  });

  // READ ONE
  describe("GET /api/adopciones/[id]", () => {
    test("Retorna la adopción por id con status 200", async () => {
      const { status, data } = await req("GET", `/api/adopciones/${adopcionId}`);
      expect(status).toBe(200);
      expect(data.id).toBe(adopcionId);
    });

    test("Retorna 404 si la adopción no existe", async () => {
      const { status } = await req("GET", "/api/adopciones/id-falso-888");
      expect(status).toBe(404);
    });
  });

  // UPDATE (cambio de estado: pendiente → aprobada / rechazada)
  describe("PUT /api/adopciones/[id]", () => {
    test("Cambia el estado de adopción a 'aprobada' y retorna 200", async () => {
      const { status, data } = await req(
        "PUT",
        `/api/adopciones/${adopcionId}`,
        { estado: "aprobada" }
      );
      expect(status).toBe(200);
      expect(data.estado).toBe("aprobada");
    });

    test("Retorna 400 si el estado no es un valor permitido", async () => {
      const { status } = await req("PUT", `/api/adopciones/${adopcionId}`, {
        estado: "en_proceso_misterioso",
      });
      expect(status).toBe(400);
    });

    test("Retorna 404 al actualizar una adopción inexistente", async () => {
      const { status } = await req("PUT", "/api/adopciones/id-falso-777", {
        estado: "aprobada",
      });
      expect(status).toBe(404);
    });
  });

  // DELETE
  describe("DELETE /api/adopciones/[id]", () => {
    test("Elimina la adopción y retorna 200 o 204", async () => {
      const { status } = await req("DELETE", `/api/adopciones/${adopcionId}`);
      expect([200, 204]).toContain(status);
    });

    test("Retorna 404 al eliminar una adopción que ya no existe", async () => {
      const { status } = await req("DELETE", `/api/adopciones/${adopcionId}`);
      expect(status).toBe(404);
    });
  });
});

// ─────────────────────────────────────────────
// 3. USUARIOS  /api/user  y  /api/user/[id]
// ─────────────────────────────────────────────
describe("USUARIOS", () => {
  let userId;

  // CREATE (registro)
  describe("POST /api/user", () => {
    test("Crea un usuario nuevo y retorna 201", async () => {
      const nuevoUsuario = {
        nombre: "María López",
        email: `maria_${Date.now()}@test.com`,
        rol: "user",
      };
      const { status, data } = await req("POST", "/api/user", nuevoUsuario);
      expect(status).toBe(201);
      expect(data).toHaveProperty("id");
      expect(data.email).toBe(nuevoUsuario.email);
      userId = data.id;
    });

    test("Retorna 400 si falta el email", async () => {
      const { status } = await req("POST", "/api/user", { nombre: "Sin Email" });
      expect(status).toBe(400);
    });

    test("Retorna 409 si el email ya está registrado", async () => {
      const { status } = await req("POST", "/api/user", {
        nombre: "Duplicado",
        email: "existente@test.com",
        rol: "user",
      });
      expect(status).toBe(409);
    });
  });

  // READ ONE
  describe("GET /api/user/[id]", () => {
    test("Retorna el usuario por id con status 200", async () => {
      const { status, data } = await req("GET", `/api/user/${userId}`);
      expect(status).toBe(200);
      expect(data.id).toBe(userId);
    });

    test("Retorna 404 si el usuario no existe", async () => {
      const { status } = await req("GET", "/api/user/id-falso-111");
      expect(status).toBe(404);
    });
  });

  // UPDATE
  describe("PUT /api/user/[id]", () => {
    test("Actualiza el nombre del usuario y retorna 200", async () => {
      const { status, data } = await req("PUT", `/api/user/${userId}`, {
        nombre: "María López Editada",
      });
      expect(status).toBe(200);
      expect(data.nombre).toBe("María López Editada");
    });

    test("Retorna 400 si se intenta cambiar el email a uno ya existente", async () => {
      const { status } = await req("PUT", `/api/user/${userId}`, {
        email: "existente@test.com",
      });
      expect(status).toBe(400);
    });

    test("Retorna 404 al actualizar un usuario inexistente", async () => {
      const { status } = await req("PUT", "/api/user/id-falso-222", {
        nombre: "Nadie",
      });
      expect(status).toBe(404);
    });
  });

  // DELETE
  describe("DELETE /api/user/[id]", () => {
    test("Elimina el usuario y retorna 200 o 204", async () => {
      const { status } = await req("DELETE", `/api/user/${userId}`);
      expect([200, 204]).toContain(status);
    });

    test("Retorna 404 al eliminar un usuario ya eliminado", async () => {
      const { status } = await req("DELETE", `/api/user/${userId}`);
      expect(status).toBe(404);
    });
  });
});

// ─────────────────────────────────────────────
// 4. AUTH  /api/auth
// ─────────────────────────────────────────────
describe("AUTH", () => {
  describe("POST /api/auth (login / registro con Supabase)", () => {
    test("Login con credenciales válidas retorna sesión o token", async () => {
      const { status, data } = await req("POST", "/api/auth", {
        email: "usuario@test.com",
        password: "password123",
        action: "login",
      });
      expect(status).toBe(200);
      expect(data).toHaveProperty("session"); // o 'token' según tu implementación
    });

    test("Retorna 401 con contraseña incorrecta", async () => {
      const { status } = await req("POST", "/api/auth", {
        email: "usuario@test.com",
        password: "clave_incorrecta",
        action: "login",
      });
      expect(status).toBe(401);
    });

    test("Retorna 400 si falta el email o la contraseña", async () => {
      const { status } = await req("POST", "/api/auth", {
        action: "login",
      });
      expect(status).toBe(400);
    });
  });
});