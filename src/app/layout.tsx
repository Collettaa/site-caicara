import type { Metadata } from "next";
import { Inter, Oswald, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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
  title: {
    default: "Caiçara Fit | Box de CrossFit e Funcional em São Vicente",
    template: "%s | Caiçara Fit - Treino e Saúde"
  },
  description: "A melhor academia de CrossFit, CrossTraining e Treino Funcional da Baixada Santista. Saúde, emagrecimento e condicionamento físico em um ambiente familiar.",
  keywords: ["CrossFit", "CrossTraining", "Treino Funcional", "Academia", "Saúde", "Emagrecimento", "Cross", "São Vicente", "Baixada Santista", "Beach Sports"],
  authors: [{ name: "Caiçara Fit" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://caicarafit.com.br",
    title: "Caiçara Fit | Cross, Funcional e Saúde",
    description: "Saúde, suor e sorrisos. O melhor espaço de CrossTraining e Funcional onde você encontra qualidade de vida, bem-estar e uma verdadeira família.",
    siteName: "Caiçara Fit",
    images: [
      {
        url: "/images/hero-group.jpg",
        width: 1200,
        height: 630,
        alt: "Família Caiçara Fit",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Caiçara Fit | CrossFit e Funcional",
    description: "Mais que uma academia, o seu estilo de vida no litoral.",
    images: ["/images/hero-group.jpg"]
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
      <body className="min-h-full flex flex-col font-sans bg-white text-zinc-900">
        <Header />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
