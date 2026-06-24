const express = require('express');
const router = express.Router();
const { createServerSupabaseClient } = require('../lib/supabaseServer');
const { isCrudTestMode } = require('../lib/isTestMode');
const {
  testAdopcionesCreate,
  testAdopcionesList,
  testAdopcionesDelete,
  testAdopcionesGetById,
  testAdopcionesUpdate,
} = require('../lib/crudTestStore');

const OWNER_CANDIDATE_COLUMNS = [
  "empresa_id",
  "empresa_usuario_id",
  "usuario_id",
  "owner_id",
  "creado_por",
];

const ESTADOS_VALIDOS = ["pendiente", "aprobado", "rechazado", "aprobada", "rechazada"];

async function findOwnerColumn(supabase) {
  for (const column of OWNER_CANDIDATE_COLUMNS) {
    const { error } = await supabase.from("mascotas").select(`id, ${column}`).limit(1);
    if (!error) return column;
  }
  return null;
}

function supabaseErrorToJson(error) {
  if (!error) return null;
  return {
    message: error.message ?? String(error),
    details: error.details ?? null,
    hint: error.hint ?? null,
    code: error.code ?? null,
  };
}

// GET - Listar solicitudes recibidas por una empresa (/api/adopciones/empresa)
router.get('/empresa', async (req, res) => {
  try {
    const supabase = createServerSupabaseClient();
    const empresaId = req.query.empresa_id;

    if (!empresaId) {
      return res.status(400).json({ error: "empresa_id es obligatorio" });
    }

    const ownerColumn = await findOwnerColumn(supabase);
    if (!ownerColumn) {
      return res.status(500).json({ error: "La tabla mascotas no tiene columna de propietario." });
    }

    const { data: mascotas, error: mascotasError } = await supabase
      .from("mascotas")
      .select("id")
      .eq(ownerColumn, empresaId);

    if (mascotasError) {
      return res.status(500).json({ error: supabaseErrorToJson(mascotasError) });
    }

    const mascotaIds = (mascotas ?? []).map((m) => m.id);

    if (mascotaIds.length === 0) {
      return res.status(200).json([]);
    }

    const { data, error } = await supabase
      .from("solicitudes_adopcion")
      .select(
        "id, estado, created_at, mensaje, telefono, direccion, usuario_id, mascota_id, usuarios(nombre,email), mascotas(nombre,especie,raza,edad,foto_url)"
      )
      .in("mascota_id", mascotaIds)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: supabaseErrorToJson(error) });
    }

    return res.status(200).json(data ?? []);
  } catch (err) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET - Listar solicitudes de adopción (/api/adopciones)
router.get('/', async (req, res) => {
  if (isCrudTestMode(req)) {
    const data = await testAdopcionesList();
    return res.status(200).json(data);
  }

  try {
    const supabase = createServerSupabaseClient();
    const usuarioId = req.query.usuario_id;
    const estado = req.query.estado;
    const empresaId = req.query.empresa_id;

    let query = supabase
      .from("solicitudes_adopcion")
      .select(
        "id, estado, created_at, mensaje, telefono, direccion, usuario_id, mascota_id, usuarios(nombre,email), mascotas(nombre,especie,raza,edad,foto_url)"
      )
      .order("created_at", { ascending: false });

    if (usuarioId) query = query.eq("usuario_id", usuarioId);
    if (estado) query = query.eq("estado", estado);

    if (empresaId) {
      const ownerColumn = await findOwnerColumn(supabase);
      if (ownerColumn) {
        const { data: minePets, error: petsError } = await supabase
          .from("mascotas")
          .select("id")
          .eq(ownerColumn, empresaId);

        if (petsError) {
          console.error("[api/adopciones][GET] error fetching company pets:", petsError);
        }

        const petIds = (minePets ?? []).map((p) => p.id);
        if (petIds.length > 0) {
          query = query.in("mascota_id", petIds);
        } else {
          return res.status(200).json([]);
        }
      }
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: supabaseErrorToJson(error) });
    }

    return res.status(200).json(data ?? []);
  } catch (err) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST - Crear solicitud de adopción (/api/adopciones)
router.post('/', async (req, res) => {
  const body = req.body;

  if (isCrudTestMode(req)) {
    const result = await testAdopcionesCreate(body);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(result.status).json(result.data);
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      usuario_id: usuarioId,
      mascota_id: mascotaId,
      mensaje,
      telefono,
      direccion,
    } = body ?? {};

    if (!usuarioId || !mascotaId) {
      return res.status(400).json({ error: "usuario_id y mascota_id son obligatorios" });
    }

    const insertPayload = {
      usuario_id: usuarioId,
      mascota_id: mascotaId,
      estado: "pendiente",
      mensaje: typeof mensaje === "string" ? mensaje.trim() : null,
      telefono: typeof telefono === "string" ? telefono.trim() : null,
      direccion: typeof direccion === "string" ? direccion.trim() : null,
    };

    const { data, error } = await supabase
      .from("solicitudes_adopcion")
      .insert(insertPayload)
      .select(
        "id, estado, created_at, mensaje, telefono, direccion, usuario_id, mascota_id"
      )
      .single();

    if (error) {
      return res.status(500).json({ error: supabaseErrorToJson(error) });
    }

    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET - Obtener solicitud por ID (/api/adopciones/:id)
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (isCrudTestMode(req)) {
    const result = await testAdopcionesGetById(id);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(result.status).json(result.data);
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("solicitudes_adopcion")
      .select("id, estado, created_at, mensaje, telefono, direccion, usuario_id, mascota_id")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT - Actualizar estado de una solicitud (/api/adopciones/:id)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const body = req.body;

  if (isCrudTestMode(req)) {
    const result = await testAdopcionesUpdate(id, body);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(result.status).json(result.data);
  }

  try {
    const supabase = createServerSupabaseClient();
    const { estado } = body ?? {};

    let estadoNormalizado = typeof estado === "string" ? estado.trim().toLowerCase() : "";

    if (!estadoNormalizado || !ESTADOS_VALIDOS.includes(estadoNormalizado)) {
      return res.status(400).json({ error: `Estado no válido. Usa: ${ESTADOS_VALIDOS.join(", ")}` });
    }

    if (estadoNormalizado === "aprobado") {
      estadoNormalizado = "aprobada";
    } else if (estadoNormalizado === "rechazado") {
      estadoNormalizado = "rechazada";
    }

    const { data, error } = await supabase
      .from("solicitudes_adopcion")
      .update({ estado: estadoNormalizado })
      .eq("id", id)
      .select("id, estado, created_at, mensaje, telefono, direccion, usuario_id, mascota_id")
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// DELETE - Eliminar/cancelar solicitud (/api/adopciones/:id)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (isCrudTestMode(req)) {
    const result = await testAdopcionesDelete(id);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(result.status).send();
  }

  try {
    const supabase = createServerSupabaseClient();

    let usuarioId = req.body?.usuario_id || req.query?.usuario_id || null;

    if (!usuarioId) {
      return res.status(400).json({ error: "usuario_id es obligatorio" });
    }

    const { data: row, error: fetchErr } = await supabase
      .from("solicitudes_adopcion")
      .select("id, usuario_id, estado")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr) {
      return res.status(500).json({ error: fetchErr.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }
    if (String(row.usuario_id) !== String(usuarioId)) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const estado = String(row.estado ?? "").trim().toLowerCase();
    if (estado !== "pendiente") {
      return res.status(400).json({ error: "Solo se pueden cancelar solicitudes pendientes" });
    }

    const { error: delErr } = await supabase
      .from("solicitudes_adopcion")
      .delete()
      .eq("id", id);

    if (delErr) {
      return res.status(500).json({ error: delErr.message });
    }

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
