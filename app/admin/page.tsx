import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminPanel from "@/components/admin/AdminPanel";
import { resolveIsAdmin } from "@/lib/auth/admin";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const isAdmin = await resolveIsAdmin(supabase, user);
  if (!isAdmin) redirect("/");

  return (
    <div className="py-8">
      <AdminPanel />
    </div>
  );
}
