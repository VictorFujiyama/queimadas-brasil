"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from "recharts";

const MapaFocos = dynamic(() => import("./MapaFocos"), { ssr: false });

const nf = new Intl.NumberFormat("pt-BR");
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const COR_REGIAO: Record<string, string> = {
  Norte: "#E66C37", Nordeste: "#D9B300", "Centro-Oeste": "#118DFF",
  Sudeste: "#1AAB40", Sul: "#744EC2",
};
const FIRE = "#E25822";
const GRID = "#eceef1";
const AXIS = "#9aa3af";

type Filtros = {
  regiao?: string; uf?: string; bioma?: string; satelite?: string;
  anoIni?: number; anoFim?: number;
};

function fmtCompact(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".", ",") + " mi";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + " mil";
  return String(n);
}
const pct = (parte: number, total: number) =>
  total > 0 ? `${Math.round((parte / total) * 100)}% do total` : undefined;

export default function Dashboard() {
  const [filtros, setFiltros] = useState<Filtros>({});
  const [data, setData] = useState<any>(null);
  const [options, setOptions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    const sp = new URLSearchParams();
    Object.entries(filtros).forEach(([k, v]) => v != null && v !== "" && sp.set(k, String(v)));
    fetch(`/api/stats?${sp.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => {
        if (j.error) throw new Error(j.error);
        setData(j.stats);
        setOptions(j.options);
        setLoading(false);
      })
      .catch((e) => { if (e.name !== "AbortError") { console.error(e); setLoading(false); } });
    return () => ctrl.abort();
  }, [filtros]);

  const set = (k: keyof Filtros, v: any) =>
    setFiltros((f) => ({ ...f, [k]: v === "" ? undefined : v }));
  const toggle = (k: keyof Filtros, v: any) =>
    setFiltros((f) => ({ ...f, [k]: f[k] === v ? undefined : v }));

  const ativos = Object.values(filtros).filter((v) => v != null && v !== "").length;

  const regiaoAnoPivot = useMemo(() => {
    if (!data) return [];
    const anos = Array.from(new Set(data.regiaoAno.map((r: any) => r.ano))).sort();
    const regioes = Array.from(new Set(data.regiaoAno.map((r: any) => r.regiao)));
    return anos.map((ano) => {
      const row: any = { ano };
      regioes.forEach((rg: any) => {
        const found = data.regiaoAno.find((x: any) => x.ano === ano && x.regiao === rg);
        row[rg] = found ? found.focos : 0;
      });
      return row;
    });
  }, [data]);

  const regioesSeries = useMemo(
    () => (data ? Array.from(new Set(data.regiaoAno.map((r: any) => r.regiao))) : []),
    [data]
  );

  const total = data?.kpis.total ?? 0;
  const vazio = !!data && total === 0;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar de filtros */}
      <aside className="w-full lg:w-64 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E25822]" />
            <span className="font-semibold text-slate-800 text-sm tracking-tight">Queimadas BR</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Painel de focos · INPE</p>
        </div>

        <div className="px-5 py-4 flex-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Filtros</h2>
            {ativos > 0 && (
              <span className="text-[11px] bg-orange-50 text-[#E25822] px-1.5 py-0.5 rounded-full font-medium">{ativos}</span>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            <Select label="Região" value={filtros.regiao || ""} onChange={(v) => set("regiao", v)}
              opts={options?.regioes || []} />
            <Select label="Estado" value={filtros.uf || ""} onChange={(v) => set("uf", v)}
              opts={(options?.ufs || []).map((u: any) => ({ value: u.uf, label: u.estado_nome }))} />
            <Select label="Bioma" value={filtros.bioma || ""} onChange={(v) => set("bioma", v)}
              opts={options?.biomas || []} />
            <Select label="Satélite" value={filtros.satelite || ""} onChange={(v) => set("satelite", v)}
              opts={options?.satelites || []} />
            <div className="grid grid-cols-2 gap-2 col-span-2 lg:col-span-1">
              <NumSelect label="De" value={filtros.anoIni} onChange={(v) => set("anoIni", v)}
                min={options?.anoMin} max={options?.anoMax} />
              <NumSelect label="Até" value={filtros.anoFim} onChange={(v) => set("anoFim", v)}
                min={options?.anoMin} max={options?.anoMax} />
            </div>
          </div>

          {ativos > 0 && (
            <button onClick={() => setFiltros({})}
              className="mt-4 w-full text-xs text-slate-600 hover:text-[#E25822] border border-slate-200 hover:border-orange-200 rounded-lg py-2 transition-colors">
              Limpar filtros
            </button>
          )}
          <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">
            Dica: clique num estado no mapa ou numa barra para filtrar.
          </p>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 text-[11px] text-slate-400 hidden lg:block">
          Fonte: INPE / TerraBrasilis<br />Satélite de referência
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 min-w-0 p-4 md:p-6">
        <header className="flex flex-wrap items-end justify-between gap-2 mb-5">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Queimadas no Brasil</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Focos de calor detectados por satélite
              {data && <> · período {data.kpis.anoIni || "—"}–{data.kpis.anoFim || "—"}</>}
            </p>
          </div>
          {loading && data && <span className="text-xs text-slate-400 animate-pulse">atualizando…</span>}
        </header>

        {!data ? (
          <Skeleton />
        ) : (
          <>
            <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
              <Kpi cor="#E25822" titulo="Total de focos" valor={nf.format(total)} icon={iconFire} destaque />
              <Kpi cor="#E66C37" titulo="Região líder" valor={data.kpis.regiaoTop}
                sub={pct(data.byRegiao[0]?.focos ?? 0, total)} icon={iconMap} />
              <Kpi cor="#118DFF" titulo="Estado líder" valor={data.kpis.estadoTop}
                sub={pct(data.byUF[0]?.focos ?? 0, total)} icon={iconPin} />
              <Kpi cor="#1AAB40" titulo="Bioma mais afetado" valor={data.kpis.biomaTop}
                sub={pct(data.byBioma[0]?.focos ?? 0, total)} icon={iconLeaf} />
              <Kpi cor="#744EC2" titulo="Estados afetados" valor={String(data.kpis.estados)} icon={iconGrid} />
              <Kpi cor="#D9B300" titulo="Municípios afetados" valor={nf.format(data.kpis.municipios)} icon={iconBuilding} />
            </section>

            {vazio ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                <p className="text-slate-700 font-medium">Sem dados para os filtros selecionados.</p>
                <p className="text-sm text-slate-400 mt-1">Ajuste ou limpe os filtros para ver os focos.</p>
                <button onClick={() => setFiltros({})}
                  className="mt-4 text-sm text-[#E25822] border border-orange-200 rounded-lg px-4 py-2 hover:bg-orange-50">
                  Limpar filtros
                </button>
              </div>
            ) : (
              <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card titulo="Evolução de focos por ano">
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data.byAno} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={FIRE} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={FIRE} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                      <XAxis dataKey="ano" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke={AXIS} fontSize={11} tickFormatter={fmtCompact} tickLine={false} axisLine={false} />
                      <Tooltip {...tip} />
                      <Area type="monotone" dataKey="focos" name="Focos" stroke={FIRE} strokeWidth={2} fill="url(#g)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                <Card titulo="Sazonalidade — focos por mês">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.byMes.map((m: any) => ({ ...m, nome: MESES[m.mes - 1] }))}
                      margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                      <XAxis dataKey="nome" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke={AXIS} fontSize={11} tickFormatter={fmtCompact} tickLine={false} axisLine={false} />
                      <Tooltip {...tip} cursor={{ fill: "#f6f7f9" }} />
                      <Bar dataKey="focos" name="Focos" fill={FIRE} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card titulo="Focos por região" hint="clique para filtrar">
                  <div className="[&_.recharts-rectangle]:cursor-pointer">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={data.byRegiao} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                        <XAxis type="number" stroke={AXIS} fontSize={11} tickFormatter={fmtCompact} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="regiao" stroke={AXIS} fontSize={12} width={86} tickLine={false} axisLine={false} />
                        <Tooltip {...tip} cursor={{ fill: "#f6f7f9" }} />
                        <Bar dataKey="focos" name="Focos" radius={[0, 4, 4, 0]} barSize={22}
                          onClick={(d: any) => d && toggle("regiao", d.regiao)}>
                          {data.byRegiao.map((r: any, i: number) => (
                            <Cell key={i} fill={COR_REGIAO[r.regiao] || FIRE}
                              fillOpacity={!filtros.regiao || filtros.regiao === r.regiao ? 1 : 0.35} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card titulo="Focos por bioma" hint="clique para filtrar">
                  <div className="[&_.recharts-rectangle]:cursor-pointer">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={data.byBioma} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                        <XAxis type="number" stroke={AXIS} fontSize={11} tickFormatter={fmtCompact} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="bioma" stroke={AXIS} fontSize={11} width={104} tickLine={false} axisLine={false} />
                        <Tooltip {...tip} cursor={{ fill: "#f6f7f9" }} />
                        <Bar dataKey="focos" name="Focos" radius={[0, 4, 4, 0]} barSize={18}
                          onClick={(d: any) => d && d.bioma && !String(d.bioma).startsWith("(") && toggle("bioma", d.bioma)}>
                          {data.byBioma.map((b: any, i: number) => (
                            <Cell key={i} fill="#1AAB40"
                              fillOpacity={!filtros.bioma || filtros.bioma === b.bioma ? 1 : 0.35} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card titulo="Ranking de estados" hint="clique para filtrar">
                  <div className="[&_.recharts-rectangle]:cursor-pointer">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.byUF} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                        <XAxis type="number" stroke={AXIS} fontSize={11} tickFormatter={fmtCompact} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="estado_nome" stroke={AXIS} fontSize={11} width={116} tickLine={false} axisLine={false} />
                        <Tooltip {...tip} cursor={{ fill: "#f6f7f9" }} />
                        <Bar dataKey="focos" name="Focos" radius={[0, 4, 4, 0]} barSize={14}
                          onClick={(d: any) => d && toggle("uf", d.uf)}>
                          {data.byUF.map((u: any, i: number) => (
                            <Cell key={i} fill={FIRE}
                              fillOpacity={!filtros.uf || filtros.uf === u.uf ? 1 : 0.35} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card titulo="Distribuição geográfica por estado" hint="clique num estado">
                  <div className="h-[300px] rounded-lg overflow-hidden border border-slate-100 bg-white">
                    <MapaFocos ufTotais={data.ufTotais} selUf={filtros.uf}
                      onSelect={(uf: string) => toggle("uf", uf)} />
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500">
                    <span>menos focos</span>
                    <span className="flex-1 h-2 rounded-full" style={{ background: "linear-gradient(90deg,#fde68a,#fbbf24,#f97316,#ef4444,#b91c1c,#7f1d1d)" }} />
                    <span>mais focos</span>
                  </div>
                </Card>

                <Card titulo="Comparação entre regiões por ano">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={regiaoAnoPivot} margin={{ top: 6, right: 12, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                      <XAxis dataKey="ano" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke={AXIS} fontSize={11} tickFormatter={fmtCompact} tickLine={false} axisLine={false} />
                      <Tooltip {...tip} />
                      <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
                      {regioesSeries.map((rg: any) => (
                        <Line key={rg} type="monotone" dataKey={rg} stroke={COR_REGIAO[rg] || FIRE}
                          strokeWidth={2} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <Card titulo="Top 10 municípios">
                  <div className="overflow-auto h-[320px]">
                    <table className="w-full text-sm">
                      <thead className="text-slate-400 text-xs uppercase tracking-wider text-left sticky top-0 bg-white">
                        <tr className="border-b border-slate-100">
                          <th className="py-2 font-medium w-6">#</th>
                          <th className="font-medium">Município</th>
                          <th className="font-medium">UF</th>
                          <th className="font-medium text-right">Focos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topMunicipios.map((m: any, i: number) => (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-2 text-slate-400">{i + 1}</td>
                            <td className="capitalize text-slate-700">{m.municipio?.toLowerCase()}</td>
                            <td className="text-slate-500">{m.uf}</td>
                            <td className="text-right font-semibold text-slate-800">{nf.format(m.focos)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </section>
            )}
          </>
        )}

        <footer className="mt-6 text-center text-xs text-slate-400">
          Programa Queimadas — INPE / TerraBrasilis · focos do satélite de referência (AQUA_M-T), 2003–2025
        </footer>
      </main>
    </div>
  );
}

const tip = {
  contentStyle: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12 },
  labelStyle: { color: "#6b7280", fontWeight: 600 },
  formatter: (v: any) => [nf.format(v as number), "Focos"],
};

function Card({ titulo, hint, children }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">{titulo}</h3>
        {hint && <span className="text-[10px] text-slate-400 uppercase tracking-wide">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Kpi({ titulo, valor, sub, cor, icon, destaque }: any) {
  return (
    <div className={`bg-white border rounded-xl p-4 shadow-sm ${destaque ? "border-orange-200" : "border-slate-200"}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: cor + "1a", color: cor }}>
          {icon}
        </span>
        <span className="text-xs text-slate-500 leading-tight">{titulo}</span>
      </div>
      <div className={`font-bold truncate ${destaque ? "text-2xl" : "text-xl"} text-slate-900`} style={destaque ? { color: cor } : {}}>
        {valor}
      </div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[92px] bg-slate-200/60 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[290px] bg-slate-200/60 rounded-xl" />)}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, opts }: { label: string; value: string; onChange: (v: string) => void; opts: any[] }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300">
        <option value="">Todos</option>
        {opts.map((o: any) =>
          typeof o === "string"
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>
        )}
      </select>
    </label>
  );
}

function NumSelect({ label, value, onChange, min, max }: { label: string; value?: number; onChange: (v: number | undefined) => void; min?: number; max?: number }) {
  const anos = [];
  for (let a = min || 2003; a <= (max || 2025); a++) anos.push(a);
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        className="mt-1 w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300">
        <option value="">—</option>
        {anos.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>
    </label>
  );
}

const sv = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const iconFire = (<svg {...sv}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>);
const iconMap = (<svg {...sv}><path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" /><path d="M9 3v15M15 6v15" /></svg>);
const iconPin = (<svg {...sv}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>);
const iconLeaf = (<svg {...sv}><path d="M11 20A7 7 0 0 1 4 13c0-6 5-10 16-10 0 9-4 14-9 17z" /><path d="M2 22c2-3 5-5 9-7" /></svg>);
const iconGrid = (<svg {...sv}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>);
const iconBuilding = (<svg {...sv}><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h6" /></svg>);
