import { Permanent_Marker } from "next/font/google";

// Letra de mão só nas anotações da etiqueta.
const marker = Permanent_Marker({ variable: "--font-marker", weight: "400", subsets: ["latin"], display: "swap" });

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return <div className={marker.variable}>{children}</div>;
}
