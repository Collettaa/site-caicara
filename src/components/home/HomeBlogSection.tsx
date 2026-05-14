import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { getBlogPosts } from "@/lib/blog";

export async function HomeBlogSection() {
  const posts = await getBlogPosts();
  const latestPosts = posts.slice(0, 3);

  if (latestPosts.length === 0) return null;

  return (
    <section className="bg-white py-20 text-zinc-950 sm:py-28">
      <div className="container px-4">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <FadeIn>
            <div>
              <span className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Blog Caiçara
              </span>
              <h2 className="mt-5 font-heading text-4xl font-black uppercase leading-[0.98] tracking-[-0.035em] sm:text-6xl">
                Conteúdo para sua evolução.
              </h2>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="max-w-xl lg:justify-self-end">
              <p className="text-lg leading-relaxed text-zinc-600">
                Dicas de treino, nutrição e estilo de vida do litoral para quem quer evoluir com consistência. Artigos escritos pela equipe da Caiçara Fit.
              </p>
              <Link
                href="/blog"
                className="mt-5 inline-flex items-center text-sm font-bold uppercase tracking-[0.12em] text-zinc-950 transition-colors hover:text-caicara-yellow-dark"
              >
                Ver todos os artigos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </FadeIn>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {latestPosts.map((post, index) => (
            <FadeIn key={post.slug} delay={0.15 + index * 0.06} direction="up">
              <Link
                href={`/blog/${post.slug}`}
                className="group flex h-full flex-col rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-6 transition-shadow hover:shadow-lg hover:shadow-zinc-950/5"
              >
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
                  <span className="rounded-md bg-caicara-yellow/15 px-2 py-1 text-caicara-yellow-dark">
                    {post.category}
                  </span>
                  <span className="inline-flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    {new Date(post.date).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold leading-snug text-zinc-900 transition-colors group-hover:text-caicara-yellow-dark line-clamp-2">
                  {post.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-600 line-clamp-3">
                  {post.description}
                </p>
                <span className="mt-5 inline-flex items-center text-sm font-bold text-zinc-900 transition-colors group-hover:text-caicara-yellow-dark">
                  Ler artigo <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
