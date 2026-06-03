import { q } from "./db";

export type Filtros = {
  regiao?: string;
  uf?: string;
  bioma?: string;
  satelite?: string;
  anoIni?: number;
  anoFim?: number;
};

// Monta WHERE dinamico. `cols` indica quais filtros a tabela suporta.
function where(f: Filtros, cols: { ano?: boolean; satelite?: boolean }) {
  const conds: string[] = [];
  const params: any[] = [];
  const add = (sql: string, val: any) => {
    params.push(val);
    conds.push(sql.replace("$?", `$${params.length}`));
  };
  if (f.regiao) add("regiao = $?", f.regiao);
  if (f.uf) add("uf = $?", f.uf);
  if (f.bioma) add("bioma = $?", f.bioma);
  if (cols.satelite && f.satelite) add("satelite = $?", f.satelite);
  if (cols.ano && f.anoIni) add("ano >= $?", f.anoIni);
  if (cols.ano && f.anoFim) add("ano <= $?", f.anoFim);
  return { clause: conds.length ? "WHERE " + conds.join(" AND ") : "", params };
}

export async function getOptions() {
  const [regioes, ufs, biomas, satelites, anos] = await Promise.all([
    q<{ regiao: string }>(`SELECT DISTINCT regiao FROM public.agg_focos ORDER BY regiao`),
    q<{ uf: string; estado_nome: string; regiao: string }>(
      `SELECT DISTINCT uf, estado_nome, regiao FROM public.agg_focos ORDER BY estado_nome`
    ),
    q<{ bioma: string }>(`SELECT DISTINCT bioma FROM public.agg_focos WHERE bioma <> '' ORDER BY bioma`),
    q<{ satelite: string }>(`SELECT DISTINCT satelite FROM public.agg_focos ORDER BY satelite`),
    q<{ min: number; max: number }>(`SELECT MIN(ano) min, MAX(ano) max FROM public.agg_focos`),
  ]);
  return {
    regioes: regioes.map((r) => r.regiao),
    ufs,
    biomas: biomas.map((b) => b.bioma),
    satelites: satelites.map((s) => s.satelite),
    anoMin: anos[0]?.min ?? 2003,
    anoMax: anos[0]?.max ?? 2025,
  };
}

export async function getStats(f: Filtros) {
  const wf = where(f, { ano: true, satelite: true });
  const wm = where(f, {}); // mapa/municipio: sem ano/satelite
  const P = wf.params;
  const PM = wm.params;

  const [
    kpis,
    byRegiao,
    byUF,
    byBioma,
    byAno,
    byMes,
    regiaoAno,
    topMunicipios,
    ufTotais,
    munCount,
  ] = await Promise.all([
    q(
      `SELECT COALESCE(SUM(focos),0)::bigint AS total,
              COUNT(DISTINCT uf) AS estados,
              MIN(ano) AS ano_ini, MAX(ano) AS ano_fim
       FROM public.agg_focos ${wf.clause}`,
      P
    ),
    q(`SELECT regiao, SUM(focos)::bigint AS focos FROM public.agg_focos ${wf.clause}
        GROUP BY regiao ORDER BY focos DESC`, P),
    q(`SELECT uf, estado_nome, SUM(focos)::bigint AS focos FROM public.agg_focos ${wf.clause}
        GROUP BY uf, estado_nome ORDER BY focos DESC LIMIT 12`, P),
    q(`SELECT bioma, SUM(focos)::bigint AS focos FROM public.agg_focos ${wf.clause}
        GROUP BY bioma ORDER BY focos DESC`, P),
    q(`SELECT ano, SUM(focos)::bigint AS focos FROM public.agg_focos ${wf.clause}
        GROUP BY ano ORDER BY ano`, P),
    q(`SELECT mes, SUM(focos)::bigint AS focos FROM public.agg_focos ${wf.clause}
        GROUP BY mes ORDER BY mes`, P),
    q(`SELECT ano, regiao, SUM(focos)::bigint AS focos FROM public.agg_focos ${wf.clause}
        GROUP BY ano, regiao ORDER BY ano`, P),
    q(`SELECT municipio, uf, SUM(focos)::bigint AS focos FROM public.agg_municipio ${wm.clause}
        GROUP BY municipio, uf ORDER BY focos DESC LIMIT 10`, PM),
    q(`SELECT uf, SUM(focos)::bigint AS focos FROM public.agg_focos ${wf.clause}
        GROUP BY uf`, P),
    q(`SELECT COUNT(DISTINCT municipio) AS n FROM public.agg_municipio ${wm.clause}`, PM),
  ]);

  const num = (x: any) => Number(x);
  return {
    kpis: {
      total: num(kpis[0]?.total ?? 0),
      estados: num(kpis[0]?.estados ?? 0),
      municipios: num(munCount[0]?.n ?? 0),
      regiaoTop: byRegiao[0]?.regiao ?? "-",
      estadoTop: byUF[0]?.estado_nome ?? "-",
      biomaTop: byBioma[0]?.bioma ?? "-",
      anoIni: num(kpis[0]?.ano_ini ?? 0),
      anoFim: num(kpis[0]?.ano_fim ?? 0),
    },
    byRegiao: byRegiao.map((r) => ({ regiao: r.regiao, focos: num(r.focos) })),
    byUF: byUF.map((r) => ({ uf: r.uf, estado_nome: r.estado_nome, focos: num(r.focos) })),
    byBioma: byBioma.map((r) => ({ bioma: r.bioma || "(sem bioma)", focos: num(r.focos) })),
    byAno: byAno.map((r) => ({ ano: num(r.ano), focos: num(r.focos) })),
    byMes: byMes.map((r) => ({ mes: num(r.mes), focos: num(r.focos) })),
    regiaoAno: regiaoAno.map((r) => ({ ano: num(r.ano), regiao: r.regiao, focos: num(r.focos) })),
    topMunicipios: topMunicipios.map((r) => ({
      municipio: r.municipio, uf: r.uf, focos: num(r.focos),
    })),
    ufTotais: ufTotais.map((r) => ({ uf: r.uf, focos: num(r.focos) })),
  };
}
