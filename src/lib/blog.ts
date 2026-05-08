import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const blogDirectory = path.join(process.cwd(), 'src/content/blog');

export interface BlogPostMeta {
  title: string;
  date: string;
  description: string;
  slug: string;
  category: string;
}

export async function getBlogPosts(): Promise<BlogPostMeta[]> {
  if (!fs.existsSync(blogDirectory)) {
    return [];
  }
  
  const fileNames = fs.readdirSync(blogDirectory);
  
  const allPosts = fileNames
    .filter(fileName => fileName.endsWith('.mdx') || fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx?$/, '');
      const fullPath = path.join(blogDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      
      const { data } = matter(fileContents);
      
      return {
        slug,
        title: data.title,
        date: data.date,
        description: data.description,
        category: data.category || 'Geral',
      } as BlogPostMeta;
    });
    
  return allPosts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPostBySlug(slug: string) {
  const fullPath = path.join(blogDirectory, `${slug}.mdx`);
  
  if (!fs.existsSync(fullPath)) {
    // Try .md
    const mdPath = path.join(blogDirectory, `${slug}.md`);
    if (!fs.existsSync(mdPath)) return null;
    
    const fileContents = fs.readFileSync(mdPath, 'utf8');
    const { data, content } = matter(fileContents);
    return { meta: { ...data, slug } as BlogPostMeta, content };
  }
  
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  
  return { meta: { ...data, slug } as BlogPostMeta, content };
}
