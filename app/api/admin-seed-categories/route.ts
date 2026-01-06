import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...(extra ?? {}) }, { status });
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const DEFAULT_CATEGORIES = [
  "Psicología clínica",
  "Neurocientífico",
  "Educativa",
  "Deportiva",
  "Psicología social",
  "Psicometría",
];

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon) {
    return jsonError(
      500,
      "Faltan variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY como fallback)."
    );
  }
  if (!service) {
    return jsonError(500, "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor (solo backend).");
  }

  const authHeader = req.headers.get("authorization") || "";
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  const jwt = m?.[1];
  if (!jwt) return jsonError(401, "No autenticado.");

  try {
    // 1) Valida JWT
    const authClient = createClient(url, anon, { auth: { persistSession: false } });
    const { data: userData, error: userError } = await authClient.auth.getUser(jwt);
    if (userError || !userData?.user) return jsonError(401, "Sesión inválida.");

    // 2) Verifica admin usando service role
    const admin = createClient(url, service, { auth: { persistSession: false } });
    const { data: perfil, error: perfilError } = await admin
      .from("perfiles")
      .select("is_admin")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (perfilError) return jsonError(500, `Error leyendo perfil: ${perfilError.message}`);
    if (!perfil?.is_admin) return jsonError(403, "Sin permisos de superadmin.");

    // Nota: evitamos depender de ON CONFLICT/UNIQUE en slug, porque en algunos proyectos
    // la columna puede no tener constraint. Insertamos solo las faltantes.
    const { data: existing, error: exErr } = await admin
      .from("categories")
      .select("id,name,slug");
    if (exErr) {
      return jsonError(400, exErr.message, {
        details: (exErr as any).details,
        hint: (exErr as any).hint,
        code: (exErr as any).code,
      });
    }

    const existingSlugs = new Set(
      (existing ?? []).map((x: any) => (x?.slug ?? "").toString()).filter(Boolean)
    );
    const existingNames = new Set(
      (existing ?? []).map((x: any) => (x?.name ?? "").toString().toLowerCase()).filter(Boolean)
    );

    const toInsert = DEFAULT_CATEGORIES.map((name, idx) => ({
      name,
      slug: slugify(name),
      sort_order: idx + 1,
    })).filter((row) => {
      const n = row.name.toLowerCase();
      return !existingNames.has(n) && (!row.slug || !existingSlugs.has(row.slug));
    });

    if (toInsert.length > 0) {
      const { error } = await admin.from("categories").insert(toInsert);
      if (error) {
        return jsonError(400, error.message, {
          details: (error as any).details,
          hint: (error as any).hint,
          code: (error as any).code,
        });
      }
    }

    return NextResponse.json({ ok: true, inserted: toInsert.length, existing: (existing ?? []).length });
  } catch (e: any) {
    return jsonError(500, e?.message ?? "Error interno.");
  }
}
