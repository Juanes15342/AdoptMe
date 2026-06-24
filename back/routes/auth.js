const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { createServerSupabaseClient } = require('../lib/supabaseServer');
const { isCrudTestMode } = require('../lib/isTestMode');
const { testAuthLogin, testSetAuthPasswordHash } = require('../lib/crudTestStore');

if (!global.resetCodes) {
    global.resetCodes = {};
}

// POST - Login (/api/auth)
router.post('/', async (req, res) => {
    const body = req.body;

    if (isCrudTestMode(req)) {
        const result = await testAuthLogin(body);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }
        return res.status(result.status).json(result.data);
    }

    try {
        const supabase = createServerSupabaseClient();
        const { email, password, role } = body;

        // 1. Buscar el usuario por email
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*, tipo_cuenta(*)')
            .eq('email', email)
            .single();

        // 2. Si no existe el usuario
        if (error || !usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // 3. Verificar la contraseña
        const passwordValida = await bcrypt.compare(password, usuario.password);

        if (!passwordValida) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // 3.5 Verificar que el rol coincida (si se especifica en el body)
        if (role) {
            const rolActual = String(usuario.tipo_cuenta?.nombre || '').toLowerCase().trim();
            const rolEsperado = String(role || '').toLowerCase().trim();

            if (rolActual !== rolEsperado) {
                return res.status(401).json({
                    error: 'El tipo de cuenta no coincide con el rol seleccionado'
                });
            }
        }

        // 4. Login exitoso, devolver usuario con su rol
        return res.status(200).json({
            message: 'Login exitoso',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                nombre_empresa: usuario.nombre_empresa ?? usuario.empresa_nombre ?? null,
                email: usuario.email,
                rol: usuario.tipo_cuenta?.nombre
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

// POST - Reset Password (/api/auth/reset-password)
router.post('/reset-password', async (req, res) => {
    const { email, code, password, action } = req.body;

    if (!email) {
        return res.status(400).json({ error: "El email es obligatorio" });
    }

    const emailNorm = String(email).trim().toLowerCase();

    // Si está en modo de prueba (test mode)
    if (isCrudTestMode(req)) {
        if (emailNorm !== "usuario@test.com") {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        if (action === "request") {
            const resetCode = "123456";
            global.resetCodes[emailNorm] = {
                code: resetCode,
                expires: Date.now() + 15 * 60 * 1000,
            };
            console.log(`[TEST MODE] Código de recuperación generado para ${emailNorm}: ${resetCode}`);
            return res.status(200).json({ message: "Código enviado", devCode: resetCode });
        }

        if (action === "verify") {
            const record = global.resetCodes[emailNorm];
            if (!record || record.code !== String(code).trim() || record.expires < Date.now()) {
                return res.status(400).json({ error: "Código inválido o expirado" });
            }
            return res.status(200).json({ message: "Código verificado con éxito" });
        }

        if (action === "reset") {
            const record = global.resetCodes[emailNorm];
            if (!record || record.code !== String(code).trim() || record.expires < Date.now()) {
                return res.status(400).json({ error: "Código inválido o expirado" });
            }

            if (!password || password.length < 6) {
                return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
            }

            const hashed = await bcrypt.hash(password, 10);
            testSetAuthPasswordHash(hashed);
            delete global.resetCodes[emailNorm];

            return res.status(200).json({ message: "Contraseña restablecida con éxito" });
        }

        return res.status(400).json({ error: "Acción no válida" });
    }

    try {
        const supabase = createServerSupabaseClient();

        // 1. Buscar usuario
        const { data: usuario, error: selectError } = await supabase
            .from("usuarios")
            .select("id")
            .eq("email", emailNorm)
            .maybeSingle();

        if (selectError) {
            return res.status(500).json({ error: "Error de base de datos" });
        }

        if (!usuario) {
            return res.status(404).json({ error: "El correo electrónico no está registrado" });
        }

        if (action === "request") {
            const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
            global.resetCodes[emailNorm] = {
                code: resetCode,
                expires: Date.now() + 15 * 60 * 1000,
            };

            console.log(`\n======================================================`);
            console.log(`[RECUPERACIÓN DE CONTRASEÑA]`);
            console.log(`Usuario: ${emailNorm}`);
            console.log(`Código generado: ${resetCode}`);
            console.log(`======================================================\n`);

            return res.status(200).json({
                message: "Código de recuperación enviado",
                devCode: resetCode
            });
        }

        if (action === "verify") {
            const record = global.resetCodes[emailNorm];
            if (!record || record.code !== String(code).trim() || record.expires < Date.now()) {
                return res.status(400).json({ error: "Código de verificación incorrecto o expirado" });
            }
            return res.status(200).json({ message: "Código verificado con éxito" });
        }

        if (action === "reset") {
            const record = global.resetCodes[emailNorm];
            if (!record || record.code !== String(code).trim() || record.expires < Date.now()) {
                return res.status(400).json({ error: "Código de verificación incorrecto o expirado" });
            }

            if (!password || password.length < 6) {
                return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
            }

            const passwordEncriptada = await bcrypt.hash(password, 10);
            const { error: updateError } = await supabase
                .from("usuarios")
                .update({ password: passwordEncriptada })
                .eq("email", emailNorm);

            if (updateError) {
                return res.status(500).json({ error: "Error al guardar la nueva contraseña" });
            }

            delete global.resetCodes[emailNorm];

            return res.status(200).json({ message: "Tu contraseña ha sido restablecida correctamente" });
        }

        return res.status(400).json({ error: "Acción no válida" });
    } catch (err) {
        console.error("Reset password error:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;
