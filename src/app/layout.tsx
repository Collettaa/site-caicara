import type { Metadata } from "next";
import { Inter, Oswald, Playfair_Display } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LocalBusinessSchema } from "@/components/seo/LocalBusinessSchema";
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
    default: "Caiçara Fit | Academia de CrossFit e Treino Funcional em São Vicente",
    template: "%s | Caiçara Fit",
  },
  description: "Mais que uma academia em São Vicente. A Caiçara Fit oferece CrossFit, crosstraining, treino funcional e beach sports para você evoluir com constância.",
  applicationName: siteConfig.name,
  category: "fitness",
  keywords: [
    "academia em São Vicente",
    "academia em São Vicente SP",
    "box de CrossFit em São Vicente",
    "crossfit são vicente",
    "cross são vicente",
    "crosstraining são vicente",
    "treino funcional são vicente",
    "beach sports são vicente",
    "futevolei são vicente",
    "beach tennis são vicente",
    "Caiçara Fit",
    "Baixada Santista",
  ],
  authors: [{ name: siteConfig.name }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    title: "Caiçara Fit | Academia, CrossFit e crosstraining em São Vicente",
    description:
      "A melhor academia de CrossFit, crosstraining e funcional em São Vicente. Acolhimento real, eventos e rotina pensada para a sua evolução.",
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.heroImage,
        width: 1200,
        height: 630,
        alt: "Alunos da Caiçara Fit treinando CrossFit em São Vicente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Caiçara Fit | Academia e CrossFit em São Vicente",
    description:
      "Academia com CrossFit, crosstraining, treino funcional, beach sports e eventos em São Vicente.",
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
        <LocalBusinessSchema />
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
      </body>
    </html>
  );
}
