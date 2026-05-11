import Script from "next/script";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Google AdSense Script - Carregado apenas na rota do blog e nos posts */}
      <Script
        id="adsbygoogle-init"
        strategy="afterInteractive"
        crossOrigin="anonymous"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9835692283497091"
      />
      
      {children}
    </>
  );
}
