import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminPanel from "@/components/admin/AdminPanel";

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

  return (
    <div className="py-8">
      <AdminPanel />
    </div>
  );
}
