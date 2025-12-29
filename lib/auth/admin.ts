import type { SupabaseClient, User } from "@supabase/supabase-js";

function isAdminFromEnv(email: string | null | undefined) {
  const envList =
    process.env.SUPER_ADMIN_EMAILS || process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || "";
  const cleaned = envList
    .split(/[\s,;]+/)
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  if (!cleaned.length || !email) return false;
  return cleaned.includes(email.toLowerCase());
}

export function isAdminFromMetadata(user: User | null) {
  if (!user) return false;
  const meta = { ...(user.user_metadata ?? {}), ...(user.app_metadata ?? {}) } as Record<string, any>;
  const role = (meta.role ?? meta.user_role ?? meta.admin_role ?? "").toString().toLowerCase();
  if (meta.is_admin === true || meta.admin === true) return true;
  if (role === "admin" || role === "superadmin") return true;
  return false;
}

export async function resolveIsAdmin(
  supabase: SupabaseClient<any, "public", any>,
  user: User | null
) {
  if (!user) return false;

  if (isAdminFromEnv(user.email)) return true;
  if (isAdminFromMetadata(user)) return true;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  return !!perfil?.is_admin;
}
