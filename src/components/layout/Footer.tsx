import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 pt-16 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Brand & About */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
              <Image 
                src="/images/logo.png" 
                alt="Caiçara Fit Logo" 
                width={50} 
                height={50} 
                className="object-contain transition-transform group-hover:scale-105 opacity-90"
              />
              <span className="text-2xl font-heading font-black tracking-tighter text-foreground">
                CAIÇARA<span className="text-caicara-yellow">FIT</span>
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
              Mais que uma academia, o seu estilo de vida. Venha fazer parte da família Caiçara Fit e alcance seus objetivos com a melhor infraestrutura da região.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">Links Rápidos</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li>
                <Link href="/#sobre" className="hover:text-caicara-yellow transition-colors">Sobre Nós</Link>
              </li>
              <li>
                <Link href="/#planos" className="hover:text-caicara-yellow transition-colors">Planos e Preços</Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-caicara-yellow transition-colors">Blog Caiçara</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">Contato</h3>
            <ul className="space-y-4 text-sm text-gray-500">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-caicara-yellow shrink-0" />
                <span>Av. Embaixador Pedro de Toledo, 593<br />São Vicente, SP - 11320-440</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-caicara-yellow shrink-0" />
                <span>(13) 92001-3547</span>
              </li>
              <li className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-caicara-yellow shrink-0"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                <a href="https://instagram.com/caicarafit013" target="_blank" rel="noopener noreferrer" className="hover:text-caicara-yellow transition-colors">
                  @caicarafit013
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Caiçara Fit. Todos os direitos reservados.</p>
          <p className="mt-2 md:mt-0">Feito para o estilo de vida Caiçara.</p>
        </div>
      </div>
    </footer>
  );
}
