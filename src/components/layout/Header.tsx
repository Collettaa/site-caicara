"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { navigationLinks, siteConfig } from "@/lib/site";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="container">
        <div className="flex h-20 items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-[50px] w-[50px] items-center justify-center transition-transform group-hover:scale-105">
              <Image
                src="/images/logo-normal.png"
                alt="Logo da Caiçara Fit"
                fill
                className="object-contain mix-blend-multiply transition-opacity duration-300 group-hover:opacity-0"
              />
              <Image
                src="/images/logo-splash.png"
                alt="Logo da Caiçara Fit Splash"
                fill
                className="absolute inset-0 object-contain mix-blend-multiply opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            </div>
            <span className="hidden text-2xl font-heading font-black tracking-tighter text-foreground sm:inline-block">
              CAIÇARA<span className="text-caicara-yellow">FIT</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
            {navigationLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-caicara-yellow">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={siteConfig.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-10 items-center justify-center rounded-full bg-caicara-yellow px-6 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95 md:inline-flex"
            >
              Treine Conosco
            </a>

            <a
              href={siteConfig.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-caicara-yellow hover:text-black md:hidden"
              aria-label="Falar com a Caiçara Fit no WhatsApp"
            >
              <MessageCircle className="h-5 w-5" />
            </a>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-caicara-yellow hover:text-black md:hidden"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <div id="mobile-menu" className="border-t border-zinc-100 py-4 pb-8 md:hidden">
            <nav className="flex flex-col gap-2">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl px-4 py-3 text-base font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-black"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={siteConfig.trialWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center justify-center rounded-full bg-caicara-yellow px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-black"
                onClick={() => setIsMenuOpen(false)}
              >
                Agendar Aula
              </a>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
