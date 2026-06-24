const express = require('express');
const router = express.Router();
const { createServerSupabaseClient } = require('../lib/supabaseServer');
const { isCrudTestMode } = require('../lib/isTestMode');
const {
  testMascotasCreate,
  testMascotasList,
  testMascotasDelete,
  testMascotasGetById,
  testMascotasUpdate,
} = require('../lib/crudTestStore');

const OWNER_CANDIDATE_COLUMNS = [
  "empresa_id",
  "empresa_usuario_id",
  "usuario_id",
  "owner_id",
  "creado_por",
];
const COMPANY_NAME_CANDIDATE_COLUMNS = [
  "empresa_nombre",
  "nombre_empresa",
  "publicado_por",
];

async function findOwnerColumn(supabase) {
  for (const column of OWNER_CANDIDATE_COLUMNS) {
    const { error } = await supabase.from("mascotas").select(`id, ${column}`).limit(1);
    if (!error) return column;
  }
  return null;
}

async function findCompanyNameColumnInMascotas(supabase) {
  for (const column of COMPANY_NAME_CANDIDATE_COLUMNS) {
    const { error } = await supabase.from("mascotas").select(`id, ${column}`).limit(1);
    if (!error) return column;
  }
  return null;
}

function isEmpresa(usuario) {
  return typeof usuario?.rol === "string" && usuario.rol.toLowerCase() === "empresa";
}

// GET - Listar mascotas (/api/mascotas)
router.get('/', async (req, res) => {
  if (isCrudTestMode(req)) {
    const data = await testMascotasList();
    return res.status(200).json(data);
  }

  try {
    const supabase = createServerSupabaseClient();
    const ownerColumn = await findOwnerColumn(supabase);
    const companyColumn = await findCompanyNameColumnInMascotas(supabase);

    const mine = req.query.mine;
    const userId = req.query.userId;
    const rol = (req.query.rol || "").toLowerCase();

    let query = supabase
      .from("mascotas")
      .select(
        companyColumn
          ? `id, nombre, especie, raza, edad, descripcion, foto_url, disponible, created_at, ${companyColumn}`
          : "id, nombre, especie, raza, edad, descripcion, foto_url, disponible, created_at"
      );

    if (mine === "1") {
      if (rol !== "empresa") {
        return res.status(401).json({ error: "No autorizado" });
      }
      if (!ownerColumn) {
        return res.status(500).json({ error: "La tabla mascotas no tiene columna de propietario (empresa_id/usuario_id)." });
      }
      query = query.eq(ownerColumn, userId);
    } else {
      query = query.eq("disponible", true);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data ?? []);
  } catch (err) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST - Publicar una mascota (/api/mascotas)
router.post('/', async (req, res) => {
  const body = req.body;

  if (isCrudTestMode(req)) {
    const result = await testMascotasCreate(body);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(result.status).json(result.data);
  }

  try {
    const supabase = createServerSupabaseClient();
    const ownerColumn = await findOwnerColumn(supabase);
    const companyColumn = await findCompanyNameColumnInMascotas(supabase);

    const {
      nombre,
      especie,
      raza,
      edad,
      descripcion,
      foto_url,
      usuario,
    } = body ?? {};

    const rol = typeof usuario?.rol === "string" ? usuario.rol.toLowerCase() : "";
    const userId = usuario?.id ?? null;

    if (rol !== "empresa") {
      return res.status(401).json({ error: "Solo una cuenta empresa puede publicar mascotas." });
    }
    if (!userId) {
      return res.status(400).json({ error: "Usuario inválido para crear mascota." });
    }
    if (!ownerColumn) {
      return res.status(500).json({ error: "Falta columna de propietario en mascotas (empresa_id/usuario_id)." });
    }

    if (!nombre || !especie) {
      return res.status(400).json({ error: "nombre y especie son obligatorios" });
    }

    const insertPayload = {
      nombre: String(nombre).trim(),
      especie: String(especie).trim(),
      raza: raza ? String(raza).trim() : null,
      edad: edad ? String(edad).trim() : null,
      descripcion: descripcion ? String(descripcion).trim() : null,
      foto_url: foto_url ? String(foto_url).trim() : null,
      disponible: true,
      [ownerColumn]: userId,
    };
    const companyName =
      typeof usuario?.nombre_empresa === "string" && usuario.nombre_empresa.trim()
        ? usuario.nombre_empresa.trim()
        : typeof usuario?.nombre === "string" && usuario.nombre.trim()
          ? usuario.nombre.trim()
          : null;
    if (companyColumn && companyName) {
      insertPayload[companyColumn] = companyName;
    }

    const { data, error } = await supabase
      .from("mascotas")
      .insert(insertPayload)
      .select("id, nombre, especie, raza, edad, descripcion, foto_url, disponible, created_at")
      .single();

    if (error) {
      const msg = String(error.message || "");
      if (msg.toLowerCase().includes("row-level security")) {
        return res.status(403).json({ error: "Supabase bloqueó el guardado por políticas RLS en la tabla mascotas." });
      }
      return res.status(500).json({ error: msg || "Error al guardar mascota" });
    }

    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET - Obtener mascota por ID (/api/mascotas/:id)
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (isCrudTestMode(req)) {
    const result = await testMascotasGetById(id);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(result.status).json(result.data);
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("mascotas")
      .select("id, nombre, especie, raza, edad, descripcion, foto_url, disponible, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ error: "Mascota no encontrada." });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT - Actualizar mascota (/api/mascotas/:id)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  if (isCrudTestMode(req)) {
    const result = await testMascotasUpdate(id, body);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(result.status).json(result.data);
  }

  try {
    const supabase = createServerSupabaseClient();
    const { usuario, ...fields } = body ?? {};

    if (!isEmpresa(usuario)) {
      return res.status(401).json({ error: "Solo empresa puede editar mascotas" });
    }
    const ownerColumn = await findOwnerColumn(supabase);
    if (!ownerColumn) {
      return res.status(500).json({ error: "La tabla mascotas no tiene columna de propietario." });
    }
    const userId = usuario?.id;
    if (!userId) {
      return res.status(400).json({ error: "Usuario inválido." });
    }

    const { data: actual, error: readError } = await supabase
      .from("mascotas")
      .select(`id, ${ownerColumn}`)
      .eq("id", id)
      .maybeSingle();
    if (readError || !actual) {
      return res.status(404).json({ error: "Mascota no encontrada." });
    }
    if (String(actual?.[ownerColumn]) !== String(userId)) {
      return res.status(403).json({ error: "No puedes editar mascotas de otra empresa." });
    }

    const updatePayload = {
      nombre: fields.nombre ? String(fields.nombre).trim() : null,
      especie: fields.especie ? String(fields.especie).trim() : null,
      raza: fields.raza ? String(fields.raza).trim() : null,
      edad: fields.edad ? String(fields.edad).trim() : null,
      descripcion: fields.descripcion ? String(fields.descripcion).trim() : null,
      foto_url: fields.foto_url ? String(fields.foto_url).trim() : null,
    };

    const { data, error } = await supabase
      .from("mascotas")
      .update(updatePayload)
      .eq("id", id)
      .eq(ownerColumn, userId)
      .select("id, nombre, especie, raza, edad, descripcion, foto_url, disponible, created_at")
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// DELETE - Eliminar mascota (/api/mascotas/:id)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (isCrudTestMode(req)) {
    const result = await testMascotasDelete(id);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(result.status).send();
  }

  try {
    const supabase = createServerSupabaseClient();
    const body = req.body || {};
    const usuario = body.usuario;

    if (!isEmpresa(usuario)) {
      return res.status(401).json({ error: "Solo empresa puede eliminar mascotas" });
    }
    const ownerColumn = await findOwnerColumn(supabase);
    if (!ownerColumn) {
      return res.status(500).json({ error: "La tabla mascotas no tiene columna de propietario." });
    }
    const userId = usuario?.id;
    if (!userId) {
      return res.status(400).json({ error: "Usuario inválido." });
    }

    const { data: actual, error: readError } = await supabase
      .from("mascotas")
      .select(`id, ${ownerColumn}`)
      .eq("id", id)
      .maybeSingle();
    if (readError || !actual) {
      return res.status(404).json({ error: "Mascota no encontrada." });
    }
    if (String(actual?.[ownerColumn]) !== String(userId)) {
      return res.status(403).json({ error: "No puedes eliminar mascotas de otra empresa." });
    }

    const { error } = await supabase
      .from("mascotas")
      .delete()
      .eq("id", id)
      .eq(ownerColumn, userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: "Mascota eliminada" });
  } catch (err) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Helper for check/create storage bucket
async function ensureBucketExists(supabase) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) return { error: listError };

  const exists = Array.isArray(buckets) && buckets.some((b) => b.name === "mascotas");
  if (exists) return { error: null };

  const { error: createError } = await supabase.storage.createBucket("mascotas", {
    public: true,
  });
  return { error: createError ?? null };
}

// Multer in-memory storage config
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// POST - Subir foto de mascota (/api/mascotas/upload)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const rol = String(req.body.rol ?? "").toLowerCase();
    const userId = String(req.body.userId ?? "").trim();

    if (rol !== "empresa") {
      return res.status(401).json({ error: "No autorizado" });
    }

    if (!file) {
      return res.status(400).json({ error: "Archivo inválido" });
    }

    const supabase = createServerSupabaseClient();
    const bytes = file.buffer;
    const ext = file.originalname && file.originalname.includes(".")
      ? file.originalname.split(".").pop()
      : "jpg";
    const safeExt = String(ext || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    
    const crypto = require('crypto');
    const path = `${userId || "empresa"}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

    let { error: uploadError } = await supabase.storage
      .from("mascotas")
      .upload(path, bytes, {
        contentType: file.mimetype || "application/octet-stream",
        upsert: false,
      });

    if (uploadError && String(uploadError.message || "").toLowerCase().includes("bucket not found")) {
      const { error: bucketError } = await ensureBucketExists(supabase);
      if (!bucketError) {
        const retry = await supabase.storage.from("mascotas").upload(path, bytes, {
          contentType: file.mimetype || "application/octet-stream",
          upsert: false,
        });
        uploadError = retry.error;
      }
    }

    if (uploadError) {
      return res.status(500).json({
        error: uploadError.message || "No se pudo subir la imagen. Verifica el bucket y sus políticas.",
      });
    }

    const { data } = supabase.storage.from("mascotas").getPublicUrl(path);
    const publicUrl = data?.publicUrl;

    if (!publicUrl) {
      return res.status(500).json({ error: "No se pudo obtener la URL pública de la imagen" });
    }

    return res.status(201).json({ publicUrl, path });
  } catch (err) {
    console.error("Error upload:", err);
    return res.status(500).json({ error: "Error interno del servidor al subir archivo" });
  }
});

module.exports = router;
