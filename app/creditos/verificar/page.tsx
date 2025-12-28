import Link from "next/link";

export const dynamic = "force-static";

export default function CreditosVerificarPage() {
  return (
    <div className="py-8">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h1 className="text-2xl font-semibold">Verificación de constancias</h1>
        <Link
          href="/creditos/verificar.html"
          target="_blank"
          className="text-xs px-3 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/10"
        >
          Abrir en pestaña
        </Link>
        <Link
          href="/creditos"
          className="text-xs px-3 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/10"
        >
          Volver a Créditos
        </Link>
      </div>

      <div className="-mx-4 sm:mx-0 border border-white/10 rounded-2xl overflow-hidden bg-black/30">
        <iframe
          src="/creditos/verificar.html"
          title="Verificación de Créditos"
          className="w-full min-h-[80vh]"
        />
      </div>
    </div>
  );
}
