import { createClient } from "@supabase/supabase-js";
import { DEFAULT_CATEGORIES, slugify } from "./categories";

/**
 * Intenta sembrar las categorías predeterminadas.
 * Preferimos la llave de servicio si existe (evita RLS), pero si no está presente
 * usamos la llave pública/anon para no depender del backend.
 */
export async function seedDefaultCategories() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL en el entorno.");
  }
  if (!serviceRoleKey && !publicKey) {
    throw new Error(
      "Faltan las llaves SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const client = createClient(url, serviceRoleKey ?? publicKey!, {
    auth: { persistSession: false },
  });

  const { data: existing, error } = await client.from("categories").select("id,name,slug");

  if (error) {
    throw new Error(error.message);
  }

  const existingSlugs = new Set((existing ?? []).map((x: any) => (x?.slug ?? "").toString()).filter(Boolean));
  const existingNames = new Set((existing ?? []).map((x: any) => (x?.name ?? "").toString().toLowerCase()).filter(Boolean));

  const toInsert = DEFAULT_CATEGORIES.map((name, idx) => ({
    name,
    slug: slugify(name),
    sort_order: idx + 1,
  })).filter((row) => {
    const n = row.name.toLowerCase();
    return !existingNames.has(n) && (!row.slug || !existingSlugs.has(row.slug));
  });

  if (toInsert.length > 0) {
    const { error: insertError } = await client.from("categories").insert(toInsert);
    if (insertError) {
      const scope = serviceRoleKey ? "service" : "pública/anon";
      throw new Error(`No se pudieron insertar categorías con la llave ${scope}: ${insertError.message}`);
    }
  }

  return { inserted: toInsert.length, existing: (existing ?? []).length };
}
