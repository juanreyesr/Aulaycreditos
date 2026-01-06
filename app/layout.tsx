import "./globals.css";
import Script from "next/script";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Aula Virtual CPG",
  description: "Aula virtual estilo catálogo, con evaluaciones y certificados",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const sbKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  return (
    <html lang="es">
      <body>
        <Script id="supabase-env" strategy="beforeInteractive">
          {`window.SB_URL = window.SB_URL || ${JSON.stringify(sbUrl)}; window.SB_KEY = window.SB_KEY || ${JSON.stringify(sbKey)};`}
        </Script>
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 pb-20">
          {children}
        </main>
        <footer className="mt-16 border-t border-white/10 py-8 text-xs text-white/50">
          <div className="mx-auto max-w-6xl px-4">
            © {new Date().getFullYear()} Colegio de Psicólogos de Guatemala — Aula Virtual (MVP)
          </div>
        </footer>
      </body>
    </html>
  );
}
