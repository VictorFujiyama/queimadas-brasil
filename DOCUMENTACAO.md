# Documentação técnica — Painel de Queimadas do Brasil

## Visão geral

Solução de Business Intelligence para análise de focos de queimada no Brasil a partir
dos dados públicos do INPE (Programa Queimadas / TerraBrasilis). Permite explorar os
focos por região, estado, bioma, satélite e período, com indicadores, séries temporais,
rankings e um mapa coroplético do país. O sistema é web, com link público e sem login.

- Sistema publicado: https://queimadas-brasil.vercel.app/
- Código-fonte: https://github.com/VictorFujiyama/queimadas-brasil

## Arquitetura

```
CSV do INPE  ->  tratamento/normalização  ->  PostgreSQL (Neon)  ->  API (Next.js)  ->  dashboard (navegador)
```

O dashboard é uma aplicação Next.js. A API interna consulta tabelas agregadas no
PostgreSQL e devolve os dados já somados para cada gráfico, o que mantém o carregamento
rápido mesmo com o histórico completo. A hospedagem do front é no Vercel e o banco no
Neon (PostgreSQL gerenciado).

## Fonte e tratamento dos dados

- Fonte: focos do satélite de referência (AQUA_M-T), Programa Queimadas — INPE.
- Período: 2003 a 2025, cerca de 5,2 milhões de registros.
- Tratamento aplicado:
  - normalização da data (geração de ano, mês e dia);
  - identificação da UF e criação da coluna de região (Norte, Nordeste, Centro-Oeste,
    Sudeste, Sul);
  - remoção de duplicatas por chave natural (importação idempotente);
  - agregação dos ~5,2 milhões de pontos em tabelas resumidas para consulta.

## Modelo de dados

Tabelas agregadas que alimentam o painel:

- `agg_focos` — focos por ano, mês, região, UF, bioma e satélite.
- `agg_municipio` — focos por município (ranking e detalhe).
- totais por UF — usados para colorir o mapa coroplético.

A conexão é lida da variável de ambiente `DATABASE_URL`; nenhuma credencial fica no
código.

## Funcionalidades

- Filtros combináveis: região, estado, bioma, satélite e intervalo de anos.
- Indicadores: total de focos, região/estado/bioma líder (com % do total), nº de
  estados e de municípios atingidos.
- Gráficos: evolução por ano, sazonalidade mensal, focos por região e por bioma,
  ranking de estados, comparação entre regiões ao longo do tempo.
- Mapa coroplético do Brasil por estado (intensidade de focos), com tooltip.
- Cross-filter: clicar em um estado no mapa ou em uma barra filtra todo o painel.
- Tabela com os 10 municípios mais atingidos.

## Stack

Next.js 14, React, Recharts (gráficos), react-leaflet (mapa), Tailwind CSS,
node-postgres (`pg`), PostgreSQL (Neon), deploy no Vercel.

## Como executar localmente

```bash
# .env.local com a conexão:
# DATABASE_URL=postgresql://usuario:senha@host/banco?sslmode=require

npm install
npm run dev   # http://localhost:3031
```

## Deploy

Repositório importado no Vercel, com a variável `DATABASE_URL` configurada em
Production e Preview. O Next.js é detectado automaticamente; cada push na branch `main`
gera um novo deploy.
