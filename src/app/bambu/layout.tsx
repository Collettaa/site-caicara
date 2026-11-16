import { Permanent_Marker } from "next/font/google";

// Letra de caneta só nos recados da página.
const marker = Permanent_Marker({ variable: "--font-marker", weight: "400", subsets: ["latin"], display: "swap" });

export default function BambuLayout({ children }: { children: React.ReactNode }) {
  return <div className={marker.variable}>{children}</div>;
}
