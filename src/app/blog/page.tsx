import { getBlogPosts } from "@/lib/blog";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Artigos sobre treino funcional, crosstraining, beach sports e estilo de vida saudável em São Vicente e na Baixada Santista. Dicas da equipe Caiçara Fit.",
  alternates: {
    canonical: "/blog",
  },
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="container py-24 min-h-[70vh]">
      <div className="max-w-3xl mb-16 text-center sm:text-left">
        <h1 className="text-5xl sm:text-6xl font-heading font-black uppercase tracking-tight text-gray-900 mb-6">
          BLOG <span className="text-caicara-yellow">CAIÇARA</span>
        </h1>
        <p className="text-gray-600 text-lg font-light leading-relaxed">
          Dicas de treino, nutrição e novidades da nossa comunidade para manter você sempre evoluindo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <Link href={`/blog/${post.slug}`} key={post.slug} className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">
              <span className="bg-yellow-50 text-caicara-yellow-dark px-2 py-1 rounded-md">{post.category}</span>
              <span className="flex items-center"><Calendar className="w-3 h-3 mr-1"/> {new Date(post.date).toLocaleDateString('pt-BR')}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-caicara-yellow transition-colors line-clamp-2">
              {post.title}
            </h2>
            <p className="text-gray-600 text-sm mb-6 line-clamp-3 flex-1">
              {post.description}
            </p>
            <div className="flex items-center font-bold text-sm text-gray-900 group-hover:text-caicara-yellow transition-colors mt-auto">
              Ler Artigo <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </Link>
        ))}
        {posts.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhum post publicado ainda.
          </div>
        )}
      </div>
    </div>
  );
}
