"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isAdminFromEnv, isAdminFromMetadata } from "@/lib/auth/admin";

export default function Navbar() {
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!active) return;
      setEmail(user?.email ?? null);
      if (user) {
        if (isAdminFromEnv(user.email) || isAdminFromMetadata(user)) {
          setIsAdmin(true);
        } else {
          const { data: perfil } = await supabase
            .from("perfiles")
            .select("is_admin")
            .eq("user_id", user.id)
            .maybeSingle();
          setIsAdmin(!!perfil?.is_admin);
        }
      } else {
        setIsAdmin(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setEmail(session?.user?.email ?? null);
      if (session?.user?.id) {
        if (isAdminFromEnv(session.user.email) || isAdminFromMetadata(session.user)) {
          setIsAdmin(true);
        } else {
          const { data: perfil } = await supabase
            .from("perfiles")
            .select("is_admin")
            .eq("user_id", session.user.id)
            .maybeSingle();
          setIsAdmin(!!perfil?.is_admin);
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-black/40 border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        <Link href="/" className="font-semibold tracking-wide text-lg">
          <span className="text-cpgRed">Aula</span> Virtual CPG
        </Link>

        <nav className="ml-2 hidden sm:flex items-center gap-3 text-sm text-white/80">
          <Link href="/" className="hover:text-white">Inicio</Link>
          <Link href="/my" className="hover:text-white">Mi progreso</Link>
          <Link href="/creditos" className="hover:text-white">Créditos</Link>
          {isAdmin && <Link href="/admin" className="hover:text-white">Administración</Link>}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="text-xs px-3 py-2 rounded-full bg-gradient-to-r from-cpgRed to-[#ff6b6b] hover:opacity-90 shadow-lg shadow-cpgRed/20"
            >
              Acceso administrador
            </Link>
          )}

          {email ? (
            <>
              <span className="text-xs text-white/70 hidden md:block">{email}</span>
              <button onClick={signOut} className="text-xs px-3 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/10">
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link href="/login" className="text-xs px-3 py-2 rounded-full bg-cpgRed hover:opacity-90">
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
