import { readRegion } from "@/lib/source";

/** Resaltado mínimo (comentarios, cadenas y palabras clave) sin dependencias. */
const TOKEN_RE =
  /(#[^\n]*|\/\/[^\n]*)|("""[\s\S]*?"""|f?"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\])*')|\b(def|class|return|if|elif|else|for|in|not|and|or|raise|try|except|import|from|as|with|None|True|False|const|let|function|export|type|case|switch|new|async|await)\b/g;

function highlight(code: string) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of code.matchAll(TOKEN_RE)) {
    if (m.index > last) parts.push(code.slice(last, m.index));
    const cls = m[1] ? "text-[#8b93a7] italic" : m[2] ? "text-[#a8d5a2]" : "text-[#9db1ff]";
    parts.push(
      <span key={m.index} className={cls}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  parts.push(code.slice(last));
  return parts;
}

export function CodeRegion({ file, region, caption }: { file: string; region: string; caption: string }) {
  const { code, startLine } = readRegion(file, region);
  return (
    <figure className="overflow-hidden rounded-2xl bg-graphite text-ivory">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 border-b border-graphite-3 px-4 py-3 text-sm">
        <span>{caption}</span>
        <span className="font-mono text-xs text-muted-dark">
          {file}:{startLine}
        </span>
      </figcaption>
      <pre tabIndex={0} className="overflow-x-auto p-4 font-mono text-[0.8rem] leading-relaxed text-[#e6e7ea]" aria-label={`Código: ${caption}`}>
        <code>{highlight(code)}</code>
      </pre>
    </figure>
  );
}

export function BuildSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-line pt-8 md:grid-cols-12 md:gap-6">
      <h3 className="eyebrow pt-1 text-muted md:col-span-3">{title}</h3>
      <div className="min-w-0 md:col-span-9">{children}</div>
    </section>
  );
}

export function Decisions({ items }: { items: { title: string; body: string; alternative: string }[] }) {
  return (
    <ol className="grid gap-4">
      {items.map((d, i) => (
        <li key={d.title} className="rounded-2xl border border-line bg-paper p-5">
          <p className="font-medium">
            <span className="mr-2 font-mono text-sm text-blue">{String(i + 1).padStart(2, "0")}</span>
            {d.title}
          </p>
          <p className="mt-2 text-sm text-muted">{d.body}</p>
          <p className="mt-2 text-sm">
            <span className="text-muted">Alternativa descartada: </span>
            {d.alternative}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** Tabla «qué es real y qué es simulación». */
export function StatusTable({ rows }: { rows: { part: string; status: string; tone: "active" | "simulated" | "pending"; detail: string }[] }) {
  const tones = { active: "text-ok", simulated: "text-warn", pending: "text-muted" };
  return (
    <div className="relative overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <thead className="bg-paper text-xs text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Pieza</th>
            <th scope="col" className="px-4 py-3 font-medium">Estado</th>
            <th scope="col" className="px-4 py-3 font-medium">Detalle</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.part} className="border-t border-line">
              <th scope="row" className="px-4 py-3 font-mono text-xs font-medium">{r.part}</th>
              <td className={`px-4 py-3 font-medium ${tones[r.tone]}`}>{r.status}</td>
              <td className="px-4 py-3 text-muted">{r.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
