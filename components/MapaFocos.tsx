"use client";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";

type UF = { uf: string; focos: number };
const nf = new Intl.NumberFormat("pt-BR");

function cor(focos: number, max: number) {
  if (!focos) return "#eef0f2";
  const t = Math.log(focos + 1) / Math.log(max + 1);
  if (t > 0.85) return "#7f1d1d";
  if (t > 0.65) return "#b91c1c";
  if (t > 0.45) return "#ef4444";
  if (t > 0.25) return "#f97316";
  if (t > 0.1) return "#fbbf24";
  return "#fde68a";
}

export default function MapaFocos({
  ufTotais, selUf, onSelect,
}: { ufTotais: UF[]; selUf?: string; onSelect?: (uf: string) => void }) {
  const [geo, setGeo] = useState<any>(null);

  useEffect(() => {
    fetch("/br-estados.geojson").then((r) => r.json()).then(setGeo).catch(() => {});
  }, []);

  const porUf: Record<string, number> = {};
  ufTotais.forEach((u) => (porUf[u.uf] = u.focos));
  const max = Math.max(1, ...ufTotais.map((u) => u.focos));

  if (!geo) return <div className="h-full grid place-items-center text-sm text-slate-400">carregando mapa…</div>;

  return (
    <MapContainer center={[-14.5, -53]} zoom={4} zoomControl={false} scrollWheelZoom={false}
      attributionControl={false} style={{ height: "100%", width: "100%", background: "#fff" }}>
      <GeoJSON
        key={JSON.stringify(porUf) + (selUf || "")}
        data={geo}
        style={(f: any) => {
          const sel = selUf === f.properties.sigla;
          return {
            fillColor: cor(porUf[f.properties.sigla] || 0, max),
            weight: sel ? 2.5 : 0.8,
            color: sel ? "#1f2937" : "#ffffff",
            fillOpacity: !selUf || sel ? 0.9 : 0.5,
          };
        }}
        onEachFeature={(f: any, layer: any) => {
          const sigla = f.properties.sigla;
          const focos = porUf[sigla] || 0;
          layer.bindTooltip(`${f.properties.name}: ${nf.format(focos)} focos`, { sticky: true });
          layer.on({
            mouseover: (e: any) => e.target.setStyle({ weight: 2, color: "#334155" }),
            mouseout: (e: any) => e.target.setStyle({ weight: selUf === sigla ? 2.5 : 0.8, color: selUf === sigla ? "#1f2937" : "#ffffff" }),
            click: () => onSelect?.(sigla),
          });
        }}
      />
    </MapContainer>
  );
}
