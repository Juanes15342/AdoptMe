import { createServerSupabaseClient } from "@/app/lib/supabaseServer";

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

// POST - Crear un usuario nuevo
export async function POST(request) {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const { data, error } = await supabase
        .from('usuarios')
        .insert([body])
        .select();

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json(data[0], { status: 201 });
}