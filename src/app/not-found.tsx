import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page grid min-h-[60vh] content-center py-24">
      <p className="eyebrow text-blue">Error 404</p>
      <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em]">Esta página no existe.</h1>
      <p className="mt-4 max-w-md text-muted">Puede que el enlace esté mal escrito o que la página se haya movido.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">
          Ir al inicio
        </Link>
        <Link href="/#proyectos" className="btn btn-ghost">
          Ver proyectos
        </Link>
      </div>
    </div>
  );
}
