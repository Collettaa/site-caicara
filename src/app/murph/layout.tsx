import { Permanent_Marker, Saira_Stencil_One } from "next/font/google";

// Estêncil (plaqueta militar: o treino homenageia um soldado) só no nome e nas repetições;
// letra de caneta só no bilhete da história.
const estencil = Saira_Stencil_One({ variable: "--font-estencil", weight: "400", subsets: ["latin"], display: "swap" });
const marker = Permanent_Marker({ variable: "--font-marker", weight: "400", subsets: ["latin"], display: "swap" });

export default function MurphLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${estencil.variable} ${marker.variable}`}>{children}</div>;
}
