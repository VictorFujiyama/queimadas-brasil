# queimadas-brasil

Painel de focos de queimada no Brasil (dados do INPE/TerraBrasilis), com filtros por
região, estado, bioma, satélite e período. Feito em Next.js, lendo de um PostgreSQL.

## Stack

Next.js 14, React, Recharts, react-leaflet, Tailwind, PostgreSQL (`pg`).

## Rodar local

Crie um `.env.local` com a conexão do banco:

```
DATABASE_URL=postgresql://usuario:senha@host/banco?sslmode=require
```

```bash
npm install
npm run dev
```

Abre em http://localhost:3031. As consultas vão para as tabelas agregadas
`agg_focos`, `agg_mapa` e `agg_municipio`.

## Deploy

Importar o repositório no Vercel e definir a variável `DATABASE_URL` (Production e
Preview). O Next é detectado automaticamente.

## Fonte dos dados

Programa Queimadas — INPE / TerraBrasilis (satélite de referência, 2003–2025).
