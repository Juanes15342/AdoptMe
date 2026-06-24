import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { isCrudTestMode } from "@/lib/isTestMode";
import {
  testUserDelete,
  testUserGetById,
  testUserUpdate,
} from "@/lib/crudTestStore";

// GET - Obtener un usuario por ID
export async function GET(request, { params }) {
    const { id } = await params;

    if (isCrudTestMode(request)) {
        const result = await testUserGetById(id);
        if (result.error) {
            return Response.json({ error: result.error }, { status: result.status });
        }
        return Response.json(result.data, { status: result.status });
    }

    const supabase = createServerSupabaseClient();

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
    const { id } = await params;
    const body = await request.json();

    if (isCrudTestMode(request)) {
        const result = await testUserUpdate(id, body);
        if (result.error) {
            return Response.json({ error: result.error }, { status: result.status });
        }
        return Response.json(result.data, { status: result.status });
    }

    const supabase = createServerSupabaseClient();

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
    const { id } = await params;

    if (isCrudTestMode(request)) {
        const result = await testUserDelete(id);
        if (result.error) {
            return Response.json({ error: result.error }, { status: result.status });
        }
        return new Response(null, { status: result.status });
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ message: 'Usuario eliminado' }, { status: 200 });
}