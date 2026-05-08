import Link from 'next/link';
import Image from 'next/image';
import { Menu } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md transition-all shadow-sm">
      <div className="container flex h-20 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-3 group">
            <Image 
              src="/images/logo.png" 
              alt="Caiçara Fit Logo" 
              width={50} 
              height={50} 
              className="object-contain transition-transform group-hover:scale-105"
            />
            <span className="text-2xl font-heading font-black tracking-tighter text-foreground hidden sm:inline-block">
              CAIÇARA<span className="text-caicara-yellow">FIT</span>
            </span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link href="/#sobre" className="hover:text-caicara-yellow transition-colors">
            Sobre
          </Link>
          <Link href="/#planos" className="hover:text-caicara-yellow transition-colors">
            Planos
          </Link>
          <Link href="/blog" className="hover:text-caicara-yellow transition-colors">
            Blog
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <a
            href="https://api.whatsapp.com/send?phone=5513920013547"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex h-10 items-center justify-center rounded-full bg-caicara-yellow px-6 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95"
          >
            Treine Conosco
          </a>
          <button className="md:hidden p-2 text-gray-600">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
