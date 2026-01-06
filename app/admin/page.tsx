import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminPanel from "@/components/admin/AdminPanel";
import { seedDefaultCategories } from "@/lib/seedDefaultCategories";

export default async function AdminPage() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!perfil?.is_admin) redirect("/");

  try {
    await seedDefaultCategories();
  } catch (e) {
    console.error("No se pudieron sembrar categorías predeterminadas desde /admin:", e);
  }

  return (
    <div className="py-8">
      <AdminPanel />
    </div>
  );
}
