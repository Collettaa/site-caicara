import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import Script from "next/script";
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

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: "Caiçara Fit | Academia de Crosstraining e Treino Funcional em São Vicente",
    template: "%s | Caiçara Fit",
  },
  description: "Mais que uma academia em São Vicente. A Caiçara Fit oferece crosstraining, treino funcional e beach sports para você evoluir com constância.",
  applicationName: siteConfig.name,
  category: "fitness",
  keywords: [
    "academia em São Vicente",
    "academia em São Vicente SP",
    "box de crosstraining em São Vicente",
    "crosstraining são vicente",
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
    title: "Caiçara Fit | Academia, crosstraining e funcional em São Vicente",
    description:
      "A melhor academia de crosstraining e funcional em São Vicente. Acolhimento real, eventos e rotina pensada para a sua evolução.",
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.heroImage,
        width: 1200,
        height: 630,
        alt: "Alunos da Caiçara Fit treinando em São Vicente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Caiçara Fit | Academia e Crosstraining em São Vicente",
    description:
      "Academia com crosstraining, treino funcional, beach sports e eventos em São Vicente.",
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
  other: {
    "google-adsense-account": siteConfig.adsensePublisherId,
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
      className={`${inter.variable} ${oswald.variable} h-full antialiased scroll-smooth`}
    >
      <Script
        id="adsbygoogle-init"
        strategy="beforeInteractive"
        crossOrigin="anonymous"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${siteConfig.adsensePublisherId}`}
      />
      <body className="flex min-h-full flex-col bg-white font-sans text-zinc-900">
        <LocalBusinessSchema />
        <Header />
        <main className="flex flex-1 flex-col mt-6">{children}</main>
        <Footer />
        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
      </body>
    </html>
  );
}
