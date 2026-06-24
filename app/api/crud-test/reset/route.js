import { isCrudTestMode } from "@/lib/isTestMode";
import { resetCrudTestStore } from "@/lib/crudTestStore";

export async function POST(request) {
  if (!isCrudTestMode(request)) {
    return Response.json({ error: "No disponible" }, { status: 404 });
  }
  resetCrudTestStore();
  return Response.json({ ok: true }, { status: 200 });
}
