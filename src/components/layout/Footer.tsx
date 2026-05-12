import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { navigationLinks, siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 pt-16 pb-8">
      <div className="container">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-3">
          <div>
            <Link href="/" className="group mb-4 inline-flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="Logo da Caiçara Fit"
                width={50}
                height={50}
                className="object-contain opacity-90 transition-transform group-hover:scale-105"
              />
              <span className="text-2xl font-heading font-black tracking-tighter text-foreground">
                CAIÇARA<span className="text-caicara-yellow">FIT</span>
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-gray-500">
              Mais que um box, um estilo de vida com acolhimento, treino, beach sports e eventos que aproximam a
              comunidade dentro e fora da praia.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-bold text-gray-900">Links Rápidos</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              {navigationLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-caicara-yellow">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-bold text-gray-900">Contato</h3>
            <ul className="space-y-4 text-sm text-gray-500">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-caicara-yellow" />
                <span>
                  {siteConfig.address.streetAddress}
                  <br />
                  {siteConfig.address.locality}, {siteConfig.address.region} - {siteConfig.address.postalCode}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-caicara-yellow" />
                <span>{siteConfig.phoneDisplay}</span>
              </li>
              <li className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-caicara-yellow"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
                <a
                  href={siteConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-caicara-yellow"
                >
                  {siteConfig.instagramHandle}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between border-t border-gray-200 pt-8 text-xs text-gray-400 md:flex-row">
          <p>© {new Date().getFullYear()} Caiçara Fit. Todos os direitos reservados.</p>
          <div className="mt-2 flex items-center gap-4 md:mt-0">
            <Link href="/politica-de-privacidade" className="transition-colors hover:text-caicara-yellow">
              Política de Privacidade
            </Link>
            <span className="text-gray-300">·</span>
            <p>Feito para o estilo de vida caiçara.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
