import bcrypt from "bcryptjs";

const ESPECIES_VALIDAS = ["perro", "gato"];
const ESTADOS_ADOPCION = ["pendiente", "aprobada", "rechazada"];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getStore() {
  if (!globalThis.__CRUD_TEST_STORE__) {
    globalThis.__CRUD_TEST_STORE__ = {
      mascotas: [],
      adopciones: [],
      usuarios: [],
      authPasswordHash: null,
    };
  }
  return globalThis.__CRUD_TEST_STORE__;
}

async function initAuthUser() {
  const store = getStore();
  if (!store.authPasswordHash) {
    store.authPasswordHash = await bcrypt.hash("password123", 10);
  }
}

export async function testMascotasList() {
  const store = getStore();
  return store.mascotas.map(({ id, nombre, especie, raza, edad, descripcion, estado }) => ({
    id,
    nombre,
    especie,
    raza,
    edad,
    descripcion,
    estado,
  }));
}

export async function testMascotasCreate(body) {
  const store = getStore();
  const { nombre, especie, raza, edad, descripcion, estado } = body ?? {};

  if (!nombre) {
    return { error: "nombre es obligatorio", status: 400 };
  }
  if (!especie || !ESPECIES_VALIDAS.includes(String(especie).toLowerCase())) {
    return { error: "especie no válida", status: 400 };
  }

  const mascota = {
    id: uid(),
    nombre: String(nombre).trim(),
    especie: String(especie).toLowerCase(),
    raza: raza ?? null,
    edad: edad ?? null,
    descripcion: descripcion ?? null,
    estado: estado ?? "disponible",
  };
  store.mascotas.push(mascota);
  return { data: mascota, status: 201 };
}

export async function testMascotasGetById(id) {
  const store = getStore();
  const mascota = store.mascotas.find((m) => m.id === id);
  if (!mascota) return { error: "Mascota no encontrada", status: 404 };
  return { data: mascota, status: 200 };
}

export async function testMascotasUpdate(id, body) {
  const store = getStore();
  const mascota = store.mascotas.find((m) => m.id === id);
  if (!mascota) return { error: "Mascota no encontrada", status: 404 };

  const fields = { ...(body ?? {}) };
  delete fields.usuario;
  if (Object.keys(fields).length === 0) {
    return { error: "Body vacío", status: 400 };
  }

  if (fields.nombre !== undefined) mascota.nombre = fields.nombre;
  if (fields.edad !== undefined) mascota.edad = fields.edad;
  if (fields.especie !== undefined) mascota.especie = fields.especie;
  if (fields.raza !== undefined) mascota.raza = fields.raza;
  if (fields.descripcion !== undefined) mascota.descripcion = fields.descripcion;
  if (fields.estado !== undefined) mascota.estado = fields.estado;

  return { data: mascota, status: 200 };
}

export async function testMascotasDelete(id) {
  const store = getStore();
  const idx = store.mascotas.findIndex((m) => m.id === id);
  if (idx === -1) return { error: "Mascota no encontrada", status: 404 };
  store.mascotas.splice(idx, 1);
  return { status: 200 };
}

export async function testAdopcionesList() {
  const store = getStore();
  return store.adopciones.map(({ id, mascota_id, usuario_id, estado, mensaje }) => ({
    id,
    mascota_id,
    usuario_id,
    estado,
    mensaje,
  }));
}

export async function testAdopcionesCreate(body) {
  const store = getStore();
  const { mascota_id, usuario_id, mensaje } = body ?? {};

  if (!mascota_id || !usuario_id) {
    return { error: "mascota_id y usuario_id son obligatorios", status: 400 };
  }

  const activa = store.adopciones.find(
    (a) =>
      a.mascota_id === mascota_id &&
      ["pendiente", "aprobada"].includes(a.estado)
  );
  if (activa || mascota_id === "uuid-mascota-ya-adoptada") {
    return { error: "Ya existe una adopción activa", status: 409 };
  }

  const adopcion = {
    id: uid(),
    mascota_id,
    usuario_id,
    mensaje: mensaje ?? null,
    estado: "pendiente",
  };
  store.adopciones.push(adopcion);
  return { data: adopcion, status: 201 };
}

export async function testAdopcionesGetById(id) {
  const store = getStore();
  const adopcion = store.adopciones.find((a) => a.id === id);
  if (!adopcion) return { error: "Adopción no encontrada", status: 404 };
  return { data: adopcion, status: 200 };
}

export async function testAdopcionesUpdate(id, body) {
  const store = getStore();
  const adopcion = store.adopciones.find((a) => a.id === id);
  if (!adopcion) return { error: "Adopción no encontrada", status: 404 };

  const estado = body?.estado;
  if (!estado || !ESTADOS_ADOPCION.includes(estado)) {
    return { error: "Estado no válido", status: 400 };
  }

  adopcion.estado = estado;
  return { data: adopcion, status: 200 };
}

export async function testAdopcionesDelete(id) {
  const store = getStore();
  const idx = store.adopciones.findIndex((a) => a.id === id);
  if (idx === -1) return { error: "Adopción no encontrada", status: 404 };
  store.adopciones.splice(idx, 1);
  return { status: 204 };
}

export async function testUserCreate(body) {
  const store = getStore();
  const { nombre, email, rol } = body ?? {};

  if (!email) {
    return { error: "email es obligatorio", status: 400 };
  }

  const emailNorm = String(email).trim().toLowerCase();
  const exists = store.usuarios.some((u) => u.email === emailNorm);
  if (exists || emailNorm === "existente@test.com") {
    return { error: "Email ya registrado", status: 409 };
  }

  const usuario = {
    id: uid(),
    nombre: nombre ?? emailNorm.split("@")[0],
    email: emailNorm,
    rol: rol ?? "user",
  };
  store.usuarios.push(usuario);
  return { data: usuario, status: 201 };
}

export async function testUserGetById(id) {
  const store = getStore();
  const usuario = store.usuarios.find((u) => u.id === id);
  if (!usuario) return { error: "Usuario no encontrado", status: 404 };
  return { data: usuario, status: 200 };
}

export async function testUserUpdate(id, body) {
  const store = getStore();
  const usuario = store.usuarios.find((u) => u.id === id);
  if (!usuario) return { error: "Usuario no encontrado", status: 404 };

  if (body?.email) {
    const emailNorm = String(body.email).trim().toLowerCase();
    const duplicado = store.usuarios.some(
      (u) => u.id !== id && u.email === emailNorm
    );
    if (duplicado || emailNorm === "existente@test.com") {
      return { error: "Email ya en uso", status: 400 };
    }
    usuario.email = emailNorm;
  }
  if (body?.nombre !== undefined) usuario.nombre = body.nombre;

  return { data: usuario, status: 200 };
}

export async function testUserDelete(id) {
  const store = getStore();
  const idx = store.usuarios.findIndex((u) => u.id === id);
  if (idx === -1) return { error: "Usuario no encontrado", status: 404 };
  store.usuarios.splice(idx, 1);
  return { status: 200 };
}

export async function testAuthLogin(body) {
  await initAuthUser();
  const { email, password, action } = body ?? {};

  if (action !== "login") {
    return { error: "Acción no soportada en modo test", status: 400 };
  }
  if (!email || !password) {
    return { error: "email y password son obligatorios", status: 400 };
  }

  if (String(email).toLowerCase() !== "usuario@test.com") {
    return { error: "Credenciales inválidas", status: 401 };
  }

  const store = getStore();
  const valid = await bcrypt.compare(password, store.authPasswordHash);
  if (!valid) {
    return { error: "Contraseña incorrecta", status: 401 };
  }

  return {
    data: {
      session: {
        access_token: "test-token",
        user: { email: "usuario@test.com" },
      },
    },
    status: 200,
  };
}

export function resetCrudTestStore() {
  globalThis.__CRUD_TEST_STORE__ = {
    mascotas: [],
    adopciones: [],
    usuarios: [],
    authPasswordHash: null,
  };
}
