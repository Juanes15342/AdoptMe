import { createServerSupabaseClient } from "@/app/lib/supabaseServer";
import bcrypt from "bcryptjs";

// POST - Login
export async function POST(request) {
    const supabase = createServerSupabaseClient();
    const { email, password } = await request.json();

    // 1. Buscar el usuario por email
    const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('*, tipo_cuenta(*)')
        .eq('email', email)
        .single();

    // 2. Si no existe el usuario
    if (error || !usuario) {
        return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 3. Verificar la contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
        return Response.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    // 4. Login exitoso, devolver usuario con su rol
    return Response.json({
        message: 'Login exitoso',
        usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.tipo_cuenta?.nombre
        }
    }, { status: 200 });
}