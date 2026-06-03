import { NextRequest, NextResponse } from "next/server";
import { getStats, getOptions, Filtros } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const f: Filtros = {
    regiao: sp.get("regiao") || undefined,
    uf: sp.get("uf") || undefined,
    bioma: sp.get("bioma") || undefined,
    satelite: sp.get("satelite") || undefined,
    anoIni: sp.get("anoIni") ? Number(sp.get("anoIni")) : undefined,
    anoFim: sp.get("anoFim") ? Number(sp.get("anoFim")) : undefined,
  };
  try {
    const [stats, options] = await Promise.all([getStats(f), getOptions()]);
    return NextResponse.json({ stats, options });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
