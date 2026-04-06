import { createServerSupabaseClient } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";

const ROLES_TIPO_CUENTA = ["administrador", "empresa", "usuario"];

// GET - Obtener todos los usuarios
export async function GET() {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
        .from('usuarios')
        .select('*');

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json(data, { status: 200 });
}

// POST - Crear un usuario nuevo (asocia tipo de cuenta vía tabla tipo_cuenta)
export async function POST(request) {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { email, password, nombre, rol } = body;

    if (!email || !password) {
        return Response.json(
            { error: "Email y contraseña son obligatorios" },
            { status: 400 }
        );
    }

    const rolNormalizado =
        typeof rol === "string" ? rol.trim().toLowerCase() : "";

    if (!rolNormalizado || !ROLES_TIPO_CUENTA.includes(rolNormalizado)) {
        return Response.json(
            { error: "Tipo de cuenta no válido" },
            { status: 400 }
        );
    }

    const { data: tipoCuenta, error: errorTipo } = await supabase
        .from("tipo_cuenta")
        .select("id")
        .eq("nombre", rolNormalizado)
        .maybeSingle();

    if (errorTipo || !tipoCuenta) {
        return Response.json(
            {
                error:
                    "No existe ese tipo de cuenta en la base de datos. Comprueba la tabla tipo_cuenta en Supabase.",
            },
            { status: 400 }
        );
    }

    const passwordEncriptada = await bcrypt.hash(password, 10);
    const nombreFinal =
        typeof nombre === "string" && nombre.trim()
            ? nombre.trim()
            : String(email).split("@")[0];

    const { data, error } = await supabase
        .from("usuarios")
        .insert({
            nombre: nombreFinal,
            email: String(email).trim().toLowerCase(),
            password: passwordEncriptada,
            tipo_cuenta_id: tipoCuenta.id,
        })
        .select("*, tipo_cuenta(*)")
        .single();

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    const { password: _omit, ...usuario } = data;
    return Response.json(usuario, { status: 201 });
}