import { createServerSupabaseClient } from "@/lib/supabaseServer";

const BUCKET = "mascotas";

async function ensureBucketExists(supabase) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) return { error: listError };

  const exists = Array.isArray(buckets) && buckets.some((b) => b.name === BUCKET);
  if (exists) return { error: null };

  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
  });
  return { error: createError ?? null };
}

export async function POST(request) {
  const supabase = createServerSupabaseClient();

  const formData = await request.formData();
  const file = formData.get("file");
  const rol = String(formData.get("rol") ?? "").toLowerCase();
  const userId = String(formData.get("userId") ?? "").trim();

  if (rol !== "empresa") {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!file || typeof file === "string") {
    return Response.json({ error: "Archivo inválido" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const ext =
    typeof file.name === "string" && file.name.includes(".")
      ? file.name.split(".").pop()
      : "jpg";
  const safeExt = String(ext || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId || "empresa"}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

  let { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  // Si el bucket no existe, lo creamos y reintentamos una vez.
  if (uploadError && String(uploadError.message || "").toLowerCase().includes("bucket not found")) {
    const { error: bucketError } = await ensureBucketExists(supabase);
    if (!bucketError) {
      const retry = await supabase.storage.from(BUCKET).upload(path, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      uploadError = retry.error;
    }
  }

  if (uploadError) {
    return Response.json(
      {
        error:
          uploadError.message ||
          `No se pudo subir la imagen. Verifica el bucket "${BUCKET}" y sus políticas.`,
      },
      { status: 500 }
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data?.publicUrl;

  if (!publicUrl) {
    return Response.json(
      { error: "No se pudo obtener la URL pública de la imagen" },
      { status: 500 }
    );
  }

  return Response.json({ publicUrl, path }, { status: 201 });
}

