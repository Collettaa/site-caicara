import { MetadataRoute } from "next";
import { getBlogPosts } from "@/lib/blog";
import { getDb } from "@/lib/loja/db";
import { listarAtivos } from "@/lib/loja/produtos";
import { lojaNoMenu, siteConfig } from "@/lib/site";

// Produtos da loja mudam sem rebuild.
export const dynamic = "force-dynamic";

function rotasDaLoja(baseUrl: string): MetadataRoute.Sitemap {
  if (!lojaNoMenu) return [];
  let produtos: { slug: string }[] = [];
  try {
    produtos = listarAtivos(getDb());
  } catch (e) {
    console.error("sitemap: falha ao ler produtos da loja", e instanceof Error ? e.message : e);
  }
  return [
    { url: `${baseUrl}/loja`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    ...produtos.map((p) => ({
      url: `${baseUrl}/loja/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.siteUrl;
  const posts = await getBlogPosts();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/aulao-rosa`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/eventos`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/sobre`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contato`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/politica-de-privacidade`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...rotasDaLoja(baseUrl), ...blogRoutes];
}
