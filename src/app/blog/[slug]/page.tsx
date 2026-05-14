import { getPostBySlug, getBlogPosts } from "@/lib/blog";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);
  
  if (!post) {
    return { title: 'Post não encontrado' };
  }

  return {
    title: post.meta.title,
    description: post.meta.description,
    alternates: {
      canonical: `/blog/${resolvedParams.slug}`,
    },
    openGraph: {
      title: post.meta.title,
      description: post.meta.description,
      type: "article",
      publishedTime: post.meta.date,
      siteName: "Caiçara Fit",
      locale: "pt_BR",
    },
    twitter: {
      card: "summary_large_image",
      title: post.meta.title,
      description: post.meta.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  // Schema Markup (Article + Breadcrumb)
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.meta.title,
      description: post.meta.description,
      datePublished: post.meta.date,
      author: {
        "@type": "Organization",
        name: "Caiçara Fit",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://caicara.store/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://caicara.store/blog" },
        { "@type": "ListItem", position: 3, name: post.meta.title },
      ],
    },
  ];

  return (
    <article className="container py-20 max-w-3xl">
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      
      <Link href="/blog" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-caicara-yellow mb-10 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Blog
      </Link>
      
      <header className="mb-12">
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-6 font-medium uppercase tracking-wider">
          <span className="bg-yellow-50 text-caicara-yellow-dark px-3 py-1 rounded-md">{post.meta.category}</span>
          <span className="flex items-center"><Calendar className="w-4 h-4 mr-2"/> {new Date(post.meta.date).toLocaleDateString('pt-BR')}</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-serif font-normal text-gray-900 mb-6 tracking-tight leading-tight">
          {post.meta.title}
        </h1>
        <p className="text-xl text-gray-600 font-light leading-relaxed">
          {post.meta.description}
        </p>
      </header>

      <div className="prose prose-lg prose-gray max-w-none prose-headings:font-serif prose-headings:font-normal prose-headings:tracking-tight prose-a:text-caicara-yellow-dark prose-a:no-underline hover:prose-a:underline">
        <MDXRemote source={post.content} />
      </div>

      {/* CTA de engajamento no final do artigo */}
      <aside className="mt-16 rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Gostou do conteúdo?
        </p>
        <h3 className="mt-3 text-2xl font-bold text-zinc-900">
          Venha conhecer a Caiçara Fit pessoalmente.
        </h3>
        <p className="mx-auto mt-3 max-w-md text-zinc-600">
          Agende uma aula experimental e sinta na prática o que a gente escreve aqui no blog.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="https://api.whatsapp.com/send?phone=5513920013547&text=Olá! Li um artigo do blog e gostaria de agendar minha aula experimental!"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-caicara-yellow px-6 py-3 text-sm font-bold uppercase tracking-[0.12em] text-black transition-transform hover:-translate-y-0.5"
          >
            Agendar aula experimental
          </a>
          <Link
            href="/blog"
            className="inline-flex items-center text-sm font-bold uppercase tracking-[0.12em] text-zinc-700 transition-colors hover:text-caicara-yellow-dark"
          >
            Ver mais artigos
          </Link>
        </div>
      </aside>
    </article>
  );
}
