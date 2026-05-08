import type { Metadata } from "next";
import { Inter, Oswald, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { siteConfig } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: "Caiçara Fit | Box de CrossFit e Funcional em São Vicente",
    template: "%s | Caiçara Fit",
  },
  description:
    "CrossFit, funcional e beach training em São Vicente com foco em saúde, acolhimento e comunidade. Conheça o box da Caiçara Fit e acompanhe nossos eventos.",
  keywords: [
    "CrossFit",
    "CrossTraining",
    "Treino Funcional",
    "Caiçara Fit",
    "Saúde",
    "São Vicente",
    "Baixada Santista",
    "Beach Sports",
    "Eventos fitness",
  ],
  authors: [{ name: siteConfig.name }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    title: "Caiçara Fit | Cross, funcional e eventos em São Vicente",
    description:
      "Saúde, treino e pertencimento em um box com cara de litoral. Veja modalidades, eventos e o jeito Caiçara de treinar.",
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.heroImage,
        width: 1200,
        height: 630,
        alt: "Família Caiçara Fit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Caiçara Fit | CrossFit, funcional e eventos",
    description: "Mais que treino: comunidade, saúde e energia de praia em São Vicente.",
    images: [siteConfig.heroImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${oswald.variable} ${playfair.variable} h-full antialiased scroll-smooth`}
    >
      <body className="flex min-h-full flex-col bg-white font-sans text-zinc-900">
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
