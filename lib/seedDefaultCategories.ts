import { DEFAULT_CATEGORIES, slugify } from "./categories";
import { createAdminClient } from "./supabase/admin";

export async function seedDefaultCategories() {
  const admin = createAdminClient();

  const { data: existing, error } = await admin
    .from("categories")
    .select("id,name,slug");

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
    const { error: insertError } = await admin.from("categories").insert(toInsert);
    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  return { inserted: toInsert.length, existing: (existing ?? []).length };
}
