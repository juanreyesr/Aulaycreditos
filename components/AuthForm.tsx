"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm() {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        router.replace("/");
        router.refresh();
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace("/");
        router.refresh();
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router, supabase]);

  async function withTimeout<T>(promise: Promise<T>, ms: number, message: string) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    });
    try {
      return await Promise.race([promise, timeout]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
          10000,
          "La autenticación está tardando demasiado. Intenta nuevamente."
        );
        if (error) throw error;
        router.replace("/");
        router.refresh();
      } else {
        const { error } = await withTimeout(
          supabase.auth.signUp({ email, password }),
          10000,
          "La creación de cuenta está tardando demasiado. Intenta nuevamente."
        );
        if (error) throw error;
        setMsg("Cuenta creada. Revisa tu correo si tu proyecto requiere confirmación de email.");
      }
    } catch (err: any) {
      setMsg(err?.message ?? "No se pudo completar la acción.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}</h2>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-xs text-white/70 hover:text-white"
        >
          {mode === "signin" ? "Crear cuenta" : "Ya tengo cuenta"}
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-xs text-white/70">
          Correo
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            className="mt-1 w-full rounded-lg bg-black/50 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
          />
        </label>

        <label className="block text-xs text-white/70">
          Contraseña
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-lg bg-black/50 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
          />
        </label>

        <button
          disabled={loading}
          className="w-full rounded-full bg-cpgRed px-4 py-2 text-sm hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Procesando..." : mode === "signin" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>

      {msg && <p className="mt-3 text-xs text-white/70">{msg}</p>}

      <p className="mt-4 text-xs text-white/50">
        Nota: En producción, se recomienda restringir el registro a agremiados (por invitación o verificación interna).
      </p>
    </div>
  );
}
