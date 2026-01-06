import { createBrowserClient } from "@supabase/ssr";

function readBrowserEnv() {
  if (typeof window === "undefined") return {} as Record<string, string | undefined>;
  const w = window as any;
  return {
    NEXT_PUBLIC_SUPABASE_URL: w.SB_URL || w.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      w.SB_KEY || w.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || w.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function createClient() {
  const browserEnv = readBrowserEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? browserEnv.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    browserEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY). Se intentó leer también SB_URL/SB_KEY del navegador."
    );
  }

  return createBrowserClient(url, key);
}
