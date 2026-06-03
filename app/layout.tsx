import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Queimadas no Brasil — Painel de Focos (INPE)",
  description:
    "Painel analítico de focos de queimada no Brasil por região, estado, bioma e período. Fonte: INPE/TerraBrasilis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
