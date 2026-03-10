import { createServerSupabaseClient } from "@/app/lib/supabaseServer";

// GET - Obtener un usuario por ID
export async function GET(request, { params }) {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        return Response.json({ error: error.message }, { status: 404 });
    }
    return Response.json(data, { status: 200 });
}

// PUT - Actualizar un usuario
export async function PUT(request, { params }) {
    const supabase = createServerSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabase
        .from('usuarios')
        .update(body)
        .eq('id', id)
        .select();

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json(data[0], { status: 200 });
}

// DELETE - Eliminar un usuario
export async function DELETE(request, { params }) {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ message: 'Usuario eliminado' }, { status: 200 });
}