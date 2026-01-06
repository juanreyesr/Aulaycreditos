import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const BodySchema = z.object({
  action: z.enum(["resend", "activate"]),
  email: z.string().email(),
});

function jsonError(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

async function findUserIdByEmail(admin: ReturnType<typeof createClient>, email: string) {
  // Supabase Auth Admin API no expone un getUserByEmail directo; se usa listUsers paginado.
  // Ver docs: auth.admin.listUsers().
  const perPage = 1000;
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const found = users.find((u: any) => (u?.email ?? "").toLowerCase() === email.toLowerCase());
    if (found?.id) return found.id as string;
    if (users.length < perPage) break; // no hay más páginas
  }
  return null;
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

    // 1) Valida que el JWT sea real y obtiene el usuario.
    const authClient = createClient(url, anon, { auth: { persistSession: false } });
    const { data: userData, error: userError } = await authClient.auth.getUser(jwt);
    if (userError || !userData?.user) return jsonError(401, "Sesión inválida.");

    // 2) Usa Service Role para leer perfil y ejecutar acciones admin.
    const admin = createClient(url, service, { auth: { persistSession: false } });

    const { data: perfil, error: perfilError } = await admin
      .from("perfiles")
      .select("is_admin")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (perfilError) return jsonError(500, `Error leyendo perfil: ${perfilError.message}`);
    if (!perfil?.is_admin) return jsonError(403, "Sin permisos de superadmin.");

    // 3) Ejecuta la acción.
    if (body.action === "resend") {
      // Resend envía nuevamente el correo de confirmación (signup) según configuración del proveedor de email.
      // Ver docs: auth.resend().
      const { error } = await authClient.auth.resend({ type: "signup", email: body.email });
      if (error) return jsonError(400, error.message);
      return NextResponse.json({ ok: true, message: "Correo de verificación reenviado." });
    }

    if (body.action === "activate") {
      const uid = await findUserIdByEmail(admin, body.email);
      if (!uid) return jsonError(404, "No se encontró un usuario con ese correo.");

      // Confirma el email manualmente.
      // Ver docs: auth.admin.updateUserById({ email_confirm: true }).
      const { error } = await admin.auth.admin.updateUserById(uid, { email_confirm: true });
      if (error) return jsonError(400, error.message);

      return NextResponse.json({ ok: true, message: "Usuario activado (email confirmado)." });
    }

    return jsonError(400, "Acción no soportada.");
  } catch (e: any) {
    if (e instanceof z.ZodError) return jsonError(400, e.issues?.[0]?.message ?? "Datos inválidos.");
    return jsonError(500, e?.message ?? "Error interno.");
  }
}
