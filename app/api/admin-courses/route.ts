import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const BodySchema = z.object({
  title: z.string().min(3),
  description: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  youtube_url: z.string().url().nullable().optional(),
  youtube_video_id: z.string().nullable().optional(),
  cover_image_url: z.string().url().nullable().optional(),
  published: z.boolean().optional(),
});

function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...(extra ?? {}) }, { status });
}

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon)
    return jsonError(
      500,
      "Faltan variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY como fallback)."
    );
  if (!service) return jsonError(500, "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor (solo backend)." );

  const authHeader = req.headers.get("authorization") || "";
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  const jwt = m?.[1];
  if (!jwt) return jsonError(401, "No autenticado.");

  try {
    const body = BodySchema.parse(await req.json());

    // 1) Valida JWT
    const authClient = createClient(url, anon, { auth: { persistSession: false } });
    const { data: userData, error: userError } = await authClient.auth.getUser(jwt);
    if (userError || !userData?.user) return jsonError(401, "Sesión inválida.");

    // 2) Verifica admin
    const admin = createClient(url, service, { auth: { persistSession: false } });
    const { data: perfil, error: perfilError } = await admin
      .from("perfiles")
      .select("is_admin")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (perfilError) return jsonError(500, `Error leyendo perfil: ${perfilError.message}`);
    if (!perfil?.is_admin) return jsonError(403, "Sin permisos de superadmin.");

    const { data, error } = await admin
      .from("courses")
      .insert({
        title: body.title.trim(),
        description: body.description ?? null,
        category_id: body.category_id ?? null,
        youtube_url: body.youtube_url ?? null,
        youtube_video_id: body.youtube_video_id ?? null,
        cover_image_url: body.cover_image_url ?? null,
        published: body.published ?? true,
      })
      .select("id")
      .single();

    if (error) {
      return jsonError(400, error.message, {
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
      });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e: any) {
    if (e instanceof z.ZodError) return jsonError(400, e.issues?.[0]?.message ?? "Datos inválidos.");
    return jsonError(500, e?.message ?? "Error interno.");
  }
}
