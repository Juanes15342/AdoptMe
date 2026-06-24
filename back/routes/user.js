const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { createServerSupabaseClient } = require('../lib/supabaseServer');
const { isCrudTestMode } = require('../lib/isTestMode');
const {
  testUserCreate,
  testUserGetById,
  testUserUpdate,
  testUserDelete,
} = require('../lib/crudTestStore');

const ROLES_TIPO_CUENTA = ["administrador", "empresa", "usuario"];
const COMPANY_NAME_COLUMNS = ["nombre_empresa", "empresa_nombre", "razon_social"];

async function findCompanyNameColumn(supabase) {
    for (const col of COMPANY_NAME_COLUMNS) {
        const { error } = await supabase.from("usuarios").select(`id, ${col}`).limit(1);
        if (!error) return col;
    }
    return null;
}

// GET - Obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        const supabase = createServerSupabaseClient();
        const { data, error } = await supabase
            .from('usuarios')
            .select('*');

        if (error) {
            return res.status(500).json({ error: error.message });
        }
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

// POST - Crear un usuario nuevo
router.post('/', async (req, res) => {
    const body = req.body;

    if (isCrudTestMode(req)) {
        const result = await testUserCreate(body);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
    }

    try {
        const supabase = createServerSupabaseClient();
        const { email, password, nombre, rol, nombreEmpresa } = body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email y contraseña son obligatorios" });
        }

        const rolNormalizado = typeof rol === "string" ? rol.trim().toLowerCase() : "";

        if (!rolNormalizado || !ROLES_TIPO_CUENTA.includes(rolNormalizado)) {
            return res.status(400).json({ error: "Tipo de cuenta no válido" });
        }

        if (rolNormalizado === "administrador") {
            return res.status(400).json({ error: "No está permitido registrarse como administrador" });
        }

        const { data: tipoCuenta, error: errorTipo } = await supabase
            .from("tipo_cuenta")
            .select("id")
            .eq("nombre", rolNormalizado)
            .maybeSingle();

        if (errorTipo || !tipoCuenta) {
            return res.status(400).json({
                error: "No existe ese tipo de cuenta en la base de datos. Comprueba la tabla tipo_cuenta en Supabase."
            });
        }

        const passwordEncriptada = await bcrypt.hash(password, 10);
        const nombreFinal = typeof nombre === "string" && nombre.trim()
            ? nombre.trim()
            : String(email).split("@")[0];

        const companyColumn = await findCompanyNameColumn(supabase);
        const companyValue = typeof nombreEmpresa === "string" && nombreEmpresa.trim()
            ? nombreEmpresa.trim()
            : null;

        const insertPayload = {
            nombre: nombreFinal,
            email: String(email).trim().toLowerCase(),
            password: passwordEncriptada,
            tipo_cuenta_id: tipoCuenta.id,
        };
        if (rolNormalizado === "empresa" && companyColumn && companyValue) {
            insertPayload[companyColumn] = companyValue;
        }

        const { data, error } = await supabase
            .from("usuarios")
            .insert(insertPayload)
            .select("*, tipo_cuenta(*)")
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        const { password: _omit, ...usuario } = data;
        return res.status(201).json(usuario);
    } catch (err) {
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

// GET - Obtener un usuario por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    if (isCrudTestMode(req)) {
        const result = await testUserGetById(id);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
    }

    try {
        const supabase = createServerSupabaseClient();
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return res.status(404).json({ error: error.message });
        }
        return res.status(200).json(data);
    } catch (err) {
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

// PUT - Actualizar un usuario
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    if (isCrudTestMode(req)) {
        const result = await testUserUpdate(id, body);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
    }

    try {
        const supabase = createServerSupabaseClient();
        const { data, error } = await supabase
            .from('usuarios')
            .update(body)
            .eq('id', id)
            .select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }
        return res.status(200).json(data[0]);
    } catch (err) {
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

// DELETE - Eliminar un usuario
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (isCrudTestMode(req)) {
        const result = await testUserDelete(id);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).send();
    }

    try {
        const supabase = createServerSupabaseClient();
        const { error } = await supabase
            .from('usuarios')
            .delete()
            .eq('id', id);

        if (error) {
            return res.status(500).json({ error: error.message });
        }
        return res.status(200).json({ message: 'Usuario eliminado' });
    } catch (err) {
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;
