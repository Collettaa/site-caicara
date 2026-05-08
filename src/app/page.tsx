import { LocalBusinessSchema } from "@/components/seo/LocalBusinessSchema";
import { ArrowRight, Star, Heart, Users, MapPin, Sun, Smile, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getGoogleReviews } from "@/lib/google-places";
import { FadeIn } from "@/components/animations/FadeIn";

export default async function Home() {
  const reviews = await getGoogleReviews();

  return (
    <>
      <LocalBusinessSchema />
      
      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-zinc-950 pt-20 pb-12">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 bg-black">
          <Image 
            src="/images/hero-group.jpg"
            alt="Família Caiçara reunida no treino"
            fill
            priority
            className="object-cover object-center opacity-50 scale-105 animate-in fade-in zoom-in duration-1000"
          />
          {/* Gradients for depth and text legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-zinc-950 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent z-10"></div>
        </div>

        <div className="container relative z-20 flex flex-col items-center sm:items-start text-center sm:text-left px-4 mt-16 w-full">
          <FadeIn delay={0.1}>
            <div className="inline-flex items-center rounded-full bg-black/30 backdrop-blur-md border border-white/10 px-6 py-2 text-xs sm:text-sm text-caicara-yellow mb-10 shadow-2xl transition-all hover:bg-black/40">
              <span className="flex h-2 w-2 rounded-full bg-caicara-yellow mr-3 animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.6)]"></span>
              <span className="tracking-[0.2em] font-medium uppercase">Vagas Limitadas • 1 Semana Grátis</span>
            </div>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <h1 className="max-w-4xl text-white mb-8 flex flex-col items-center sm:items-start">
              <span className="font-serif text-4xl sm:text-6xl tracking-[0.05em] text-white/80 mb-2 font-normal italic">Lugar de</span>
              <span className="font-heading font-black uppercase text-[5.5rem] sm:text-[8rem] md:text-[10rem] lg:text-[12rem] leading-[0.8] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-caicara-yellow to-yellow-600 drop-shadow-xl py-2">
                CAIÇARA
              </span>
              <span className="font-heading font-bold uppercase text-2xl sm:text-4xl tracking-[0.3em] mt-3 sm:ml-2 text-white/90">
                É AQUI.
              </span>
            </h1>
          </FadeIn>
          
          <FadeIn delay={0.3}>
            <p className="max-w-2xl text-base sm:text-lg md:text-xl text-zinc-300/90 mb-14 font-light leading-relaxed sm:border-l-[3px] sm:border-caicara-yellow sm:pl-6 text-center sm:text-left">
              Resultados de verdade em um ambiente onde você não é só um número. 
              <strong className="text-white font-medium"> Transforme seu corpo e sua rotina</strong> na comunidade mais acolhedora da Baixada Santista.
            </p>
          </FadeIn>
          
          <FadeIn delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a
                href="https://api.whatsapp.com/send?phone=5513920013547&text=Olá! Gostaria de resgatar minha 1 semana de aula grátis!"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex h-14 sm:h-16 w-full sm:w-auto items-center justify-center overflow-hidden rounded-full bg-caicara-yellow px-8 sm:px-10 font-sans font-bold text-sm sm:text-base uppercase tracking-[0.1em] text-black transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                <span className="absolute inset-0 h-full w-full bg-gradient-to-r from-yellow-400 to-yellow-500 group-hover:opacity-90 transition-opacity duration-300"></span>
                <span className="relative flex items-center gap-3">
                  Liberar Minha Aula
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </a>
              <Link
                href="/blog"
                className="inline-flex h-14 sm:h-16 w-full sm:w-auto items-center justify-center rounded-full border border-white/20 bg-transparent px-8 sm:px-10 font-sans font-medium text-sm sm:text-base uppercase tracking-[0.1em] text-white hover:bg-white hover:text-black transition-all duration-500"
              >
                Conhecer a Família
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Por que a Caiçara? */}
      <section className="py-24 bg-zinc-50 text-black">
        <div className="container px-4">
          <FadeIn delay={0.1}>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl sm:text-6xl font-heading font-black uppercase tracking-tight mb-6">Por que a <span className="text-caicara-yellow">Caiçara?</span></h2>
              <p className="text-zinc-600 text-xl font-medium">Nós não vendemos culto ao corpo perfeito. Nós oferecemos acolhimento, lazer e superação pessoal.</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FadeIn delay={0.2} direction="up">
              <div className="bg-white p-10 rounded-3xl shadow-md border border-zinc-100 text-center flex flex-col items-center hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
                <div className="w-20 h-20 bg-yellow-100 text-yellow-600 flex items-center justify-center rounded-full mb-8">
                  <Heart className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-heading font-black uppercase mb-4">Acolhimento</h3>
                <p className="text-zinc-600 text-lg">Todo mundo começa do zero. Não importa sua idade ou tipo físico, nós guiamos você com todo cuidado e atenção.</p>
              </div>
            </FadeIn>
            
            <FadeIn delay={0.3} direction="up">
              <div className="bg-white p-10 rounded-3xl shadow-md border border-zinc-100 text-center flex flex-col items-center hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
                <div className="w-20 h-20 bg-yellow-100 text-yellow-600 flex items-center justify-center rounded-full mb-8">
                  <Users className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-heading font-black uppercase mb-4">Comunidade</h3>
                <p className="text-zinc-600 text-lg">Aqui você não é um número. Você faz parte da Família Caiçara. Celebramos cada pequena conquista juntos todos os dias.</p>
              </div>
            </FadeIn>

            <FadeIn delay={0.4} direction="up">
              <div className="bg-white p-10 rounded-3xl shadow-md border border-zinc-100 text-center flex flex-col items-center hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
                <div className="w-20 h-20 bg-yellow-100 text-yellow-600 flex items-center justify-center rounded-full mb-8">
                  <Sun className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-heading font-black uppercase mb-4">Estilo de Vida</h3>
                <p className="text-zinc-600 text-lg">Treinos dinâmicos, pé na areia e eventos ao ar livre. Conexão profunda com a natureza e com o seu bem-estar diário.</p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Modalidades */}
      <section className="py-24 bg-white text-black">
        <div className="container px-4">
          <FadeIn delay={0.1}>
            <div className="text-center max-w-4xl mx-auto mb-16">
              <h2 className="text-4xl sm:text-6xl font-heading font-black uppercase tracking-tight mb-6">CrossFit e Funcional em <span className="text-caicara-yellow">São Vicente</span></h2>
              <p className="text-zinc-600 text-xl font-medium">Sem jargões complicados. O melhor do CrossTraining adaptado para a sua realidade, focado em saúde e emagrecimento.</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-auto md:h-[500px]">
            {/* Funcional & CrossFit */}
            <FadeIn delay={0.2} direction="right" className="h-full">
              <div className="group relative rounded-3xl overflow-hidden bg-zinc-100 h-[400px] md:h-full border border-zinc-200 shadow-lg">
                 <Image 
                   src="/images/open-1.jpeg"
                   alt="Treino Funcional Open"
                   fill
                   sizes="(max-width: 768px) 100vw, 50vw"
                   className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                 
                 <div className="absolute inset-x-0 bottom-0 p-10 flex flex-col justify-end text-white">
                   <h3 className="text-4xl font-heading font-black uppercase mb-4">Funcional & Cross</h3>
                   <p className="text-zinc-200 mb-8 max-w-md text-lg">Treinos adaptados para ganhar mobilidade, força e fôlego para o seu dia a dia. Para você viver melhor, sem dores e com mais energia.</p>
                   <a href="https://wa.me/5513920013547" className="flex items-center text-caicara-yellow font-heading font-bold uppercase tracking-wider text-lg hover:text-yellow-300 transition-colors w-fit">
                     Agendar Aula <ArrowRight className="ml-2 h-5 w-5" />
                   </a>
                 </div>
              </div>
            </FadeIn>

            {/* Beach Sports / Hyrox */}
            <FadeIn delay={0.3} direction="left" className="h-full">
              <div className="group relative rounded-3xl overflow-hidden bg-zinc-100 h-[400px] md:h-full border border-zinc-200 shadow-lg">
                 <Image 
                   src="/images/beach-sports-new.jpg"
                   alt="Hyrox e Beach Sports"
                   fill
                   sizes="(max-width: 768px) 100vw, 50vw"
                   className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                 
                 <div className="absolute inset-x-0 bottom-0 p-10 flex flex-col justify-end text-white">
                   <h3 className="text-4xl font-heading font-black uppercase mb-4">Beach Sports</h3>
                   <p className="text-zinc-200 mb-8 max-w-md text-lg">Futevôlei e Beach Tennis com a galera! Aulas dinâmicas e divertidas para você suar na areia e dar muitas risadas.</p>
                   <a href="https://wa.me/5513920013547" className="flex items-center text-caicara-yellow font-heading font-bold uppercase tracking-wider text-lg hover:text-yellow-300 transition-colors w-fit">
                     Agendar Aula <ArrowRight className="ml-2 h-5 w-5" />
                   </a>
                 </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Eventos e Comunidade */}
      <section className="py-32 bg-zinc-950 text-white relative overflow-hidden">
        <div className="container px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn delay={0.1} direction="right">
              <div>
                <h2 className="text-4xl sm:text-6xl font-heading font-black uppercase tracking-tight mb-8">Caiçara <span className="text-caicara-yellow">Experience</span></h2>
                <p className="text-zinc-300 text-xl mb-10 leading-relaxed">
                  Nós vamos muito além do treino de todo dia. Promovemos passeios de canoa havaiana, yoga ao nascer do sol, cafés da manhã comunitários e os famosos "Treinos na Areia". É assim que construímos laços de verdade.
                </p>
                <ul className="space-y-6 mb-12">
                  <li className="flex items-center text-zinc-200 text-lg font-medium">
                    <Calendar className="h-8 w-8 text-caicara-yellow mr-6 shrink-0" />
                    <span>Eventos mensais exclusivos para alunos</span>
                  </li>
                  <li className="flex items-center text-zinc-200 text-lg font-medium">
                    <Sun className="h-8 w-8 text-caicara-yellow mr-6 shrink-0" />
                    <span>Treinos com o pé na areia todo mês</span>
                  </li>
                  <li className="flex items-center text-zinc-200 text-lg font-medium">
                    <Smile className="h-8 w-8 text-caicara-yellow mr-6 shrink-0" />
                    <span>Ambiente totalmente familiar e acolhedor</span>
                  </li>
                </ul>
                <Link
                  href="/blog"
                  className="inline-flex h-16 items-center justify-center rounded-lg bg-caicara-yellow px-10 font-heading font-black text-lg uppercase tracking-wider text-black hover:bg-yellow-400 transition-all shadow-lg hover:-translate-y-1"
                >
                  Ver Nossos Eventos
                </Link>
              </div>
            </FadeIn>
            
            <FadeIn delay={0.3} direction="left">
              <div className="h-[500px] sm:h-[600px] rounded-3xl overflow-hidden relative shadow-2xl border border-zinc-800">
                <Image 
                  src="/images/yoga-day-5.jpeg"
                  alt="Yoga Day Caiçara Experience"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover hover:scale-105 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-black/10"></div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Prova Social / Google Reviews */}
      <section className="py-32 bg-caicara-yellow text-black">
        <div className="container px-4">
          <FadeIn delay={0.1}>
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-6xl font-heading font-black uppercase tracking-tight mb-6">O que diz <span className="underline decoration-black decoration-4 underline-offset-8">nossa comunidade</span></h2>
              <p className="font-medium text-xl text-black/70">Avaliações reais no Google</p>
            </div>
          </FadeIn>

          {reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reviews.slice(0, 3).map((review, i) => (
                <FadeIn key={i} delay={0.2 + (i * 0.1)} direction="up">
                  <div className="bg-white p-8 rounded-3xl shadow-xl shadow-black/5 flex flex-col h-full hover:-translate-y-2 transition-all duration-300">
                    <div className="flex justify-start mb-6">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-6 w-6 ${star <= review.rating ? 'text-caicara-yellow fill-current' : 'text-zinc-300'}`} />
                      ))}
                    </div>
                    <blockquote className="text-xl font-medium mb-8 flex-1 text-zinc-800 line-clamp-5 italic">
                      "{review.text}"
                    </blockquote>
                    <div className="flex items-center mt-auto pt-6 border-t border-zinc-100">
                      <img src={review.profile_photo_url} alt={review.author_name} className="w-12 h-12 rounded-full mr-4 border-2 border-caicara-yellow" />
                      <div>
                        <div className="font-heading font-bold text-base uppercase tracking-wide">{review.author_name}</div>
                        <div className="text-zinc-500 text-sm font-medium">{review.relative_time_description}</div>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          ) : (
            // Fallback se a API falhar ou não estiver configurada
            <FadeIn delay={0.2} direction="up">
              <div className="max-w-4xl mx-auto text-center bg-white/20 p-10 sm:p-16 rounded-3xl backdrop-blur-sm border border-black/10">
                <div className="flex justify-center mb-8">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-10 w-10 text-black fill-current" />
                  ))}
                </div>
                <blockquote className="text-3xl sm:text-5xl font-heading font-black uppercase tracking-tight mb-12 leading-tight">
                  "Achei que Cross não era pra mim, mas fui acolhida desde o primeiro dia. Perdi minhas dores nas costas e hoje a Caiçara é a minha segunda família. Melhor decisão."
                </blockquote>
                <div className="flex items-center justify-center mt-8">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden mr-6 border-4 border-black/20 shadow-lg">
                     <Image src="/images/mulheres-1.jpg" alt="Aluna da Caiçara" fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="text-left">
                    <div className="font-heading font-black text-2xl uppercase tracking-wide">Aluna Real</div>
                    <div className="text-black/80 font-medium font-mono text-sm">Review do Google</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* Galeria / Instagram (Nossa Comunidade) */}
      <section className="py-24 bg-zinc-50 text-black border-t border-zinc-200">
        <div className="container px-4">
          <FadeIn delay={0.1}>
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-6xl font-heading font-black uppercase tracking-tight mb-4">A Nossa <span className="text-caicara-yellow">Família</span></h2>
              <p className="text-zinc-600 text-xl font-medium">Um pouco do nosso dia a dia no Box e na Praia.</p>
            </div>
          </FadeIn>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <FadeIn delay={0.2}>
              <div className="relative aspect-square rounded-2xl overflow-hidden group">
                <Image src="/images/mulheres-1.jpg" alt="Alunas no treino de Funcional" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="relative aspect-square rounded-2xl overflow-hidden group">
                <Image src="/images/yoga-day-5.jpeg" alt="Yoga Day na praia" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </FadeIn>
            <FadeIn delay={0.4}>
              <div className="relative aspect-square rounded-2xl overflow-hidden group">
                <Image src="/images/community.jpg" alt="Comunidade Crossfit Caiçara" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </FadeIn>
            <FadeIn delay={0.5}>
              <div className="relative aspect-square rounded-2xl overflow-hidden group">
                <Image src="/images/running-funcional.jpg" alt="Treino ao ar livre" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </FadeIn>
            <FadeIn delay={0.6}>
              <div className="relative aspect-square rounded-2xl overflow-hidden group">
                <Image src="/images/open-1.jpeg" alt="Competição no Box" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </FadeIn>
            <FadeIn delay={0.7}>
              <div className="relative aspect-square rounded-2xl overflow-hidden group">
                <Image src="/images/women-laughing.jpg" alt="Amizade e Suor" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </FadeIn>
          </div>
          
          <FadeIn delay={0.8}>
            <div className="mt-12 text-center">
              <a href="https://instagram.com/caicarafit013" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-black font-heading font-black uppercase text-xl hover:text-caicara-yellow transition-colors">
                Acompanhe no Instagram <ArrowRight className="ml-2 w-6 h-6" />
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
      
      {/* Footer CTA */}
      <section className="py-28 bg-zinc-50 text-center border-t border-zinc-200">
        <div className="container px-4">
          <FadeIn delay={0.1}>
            <h2 className="text-4xl sm:text-6xl font-heading font-black uppercase mb-8 text-black tracking-tight">Pronto para mudar seu <span className="text-caicara-yellow underline decoration-8 underline-offset-8">estilo de vida?</span></h2>
            <p className="text-zinc-600 mb-12 max-w-3xl mx-auto text-2xl font-medium leading-relaxed">Venha tomar um café com a gente, conhecer a estrutura e fazer sua primeira aula gratuita. Sem compromisso, apenas saúde.</p>
            <a
              href="https://api.whatsapp.com/send?phone=5513920013547"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-20 items-center justify-center rounded-xl bg-black px-16 font-heading font-black text-2xl uppercase tracking-wider text-white hover:bg-zinc-800 hover:-translate-y-2 transition-all shadow-2xl hover:shadow-black/30"
            >
              Vem pra família!
            </a>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
