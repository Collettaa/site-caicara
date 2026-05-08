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
    openGraph: {
      title: post.meta.title,
      description: post.meta.description,
      type: "article",
      publishedTime: post.meta.date,
    }
  };
}

export default async function BlogPostPage({ params }: Props) {
  const resolvedParams = await params;
  const post = await getPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  // Configuração Schema Markup (Article)
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.meta.title,
    "description": post.meta.description,
    "datePublished": post.meta.date,
    "author": {
      "@type": "Organization",
      "name": "Caiçara Fit"
    }
  };

  return (
    <article className="container py-20 max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      
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
    </article>
  );
}
