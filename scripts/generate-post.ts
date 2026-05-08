import fs from 'fs';
import path from 'path';
import { loadEnvConfig } from '@next/env';

// Carrega as variáveis do .env.local
const projectDir = process.cwd();
loadEnvConfig(projectDir);

// Configurações
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BLOG_DIR = path.join(process.cwd(), 'src', 'content', 'blog');

// Tópicos estratégicos para Caiçara Fit (SEO & Vendas)
const TOPICS = [
  "Benefícios do Treino Funcional na Praia para Iniciantes",
  "Como o CrossFit ajuda no Emagrecimento Definitivo",
  "Diferença entre Academia Tradicional e CrossTraining",
  "5 Motivos para começar a treinar em São Vicente hoje",
  "Como prevenir lesões e ganhar força depois dos 30 anos",
  "Alimentação pré-treino para aguentar um WOD intenso",
  "Saúde mental: como o exercício em comunidade combate a ansiedade",
  "Mobilidade e flexibilidade: o segredo que ninguém te conta",
  "Como perder a barriga treinando apenas 45 minutos por dia",
];

function getSlug(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function generatePost() {
  if (!GEMINI_API_KEY) {
    console.error("ERRO: GEMINI_API_KEY não encontrada no ambiente.");
    process.exit(1);
  }

  // Escolhe um tópico aleatório
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  console.log(`Gerando artigo sobre: "${topic}"...`);

  const prompt = `
    Você é um especialista em Marketing Digital, SEO e Copywriting da 'Caiçara Fit', a melhor academia de CrossFit e Treino Funcional de São Vicente (Baixada Santista).
    Escreva um artigo de blog completo e otimizado para SEO sobre: "${topic}".

    REGRAS DO ARTIGO:
    1. Formato: O texto DEVE estar em formato MDX (Markdown).
    2. Tom de voz: Acolhedor, motivacional, empático e sofisticado. Sem jargões técnicos difíceis.
    3. Foco em SEO: Inclua palavras-chave naturalmente como: CrossFit em São Vicente, Treino Funcional, Baixada Santista, Emagrecimento, Saúde, Qualidade de vida.
    4. Estrutura: Use títulos H2 e H3 (## e ###), parágrafos curtos, bullet points se necessário.
    5. Call to Action (CTA): O final do artigo DEVE ter uma chamada forte convidando o leitor a conhecer a Caiçara Fit e agendar uma aula experimental grátis clicando neste link do WhatsApp: https://api.whatsapp.com/send?phone=5513920013547.
    6. Frontmatter: O artigo DEVE começar exatamente com a estrutura YAML abaixo:

    ---
    title: "[Título super chamativo e com SEO]"
    description: "[Descrição curta de até 150 caracteres para o Google]"
    date: "[Data atual no formato YYYY-MM-DD]"
    category: "[Categoria: Funcional, CrossFit, Saúde ou Emagrecimento]"
    ---

    [Conteúdo do artigo aqui]

    Escreva APENAS o código MDX com o frontmatter e o artigo, sem comentários adicionais.
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Erro na API:", data);
      process.exit(1);
    }

    let content = data.candidates[0].content.parts[0].text;
    
    // Limpa a resposta (remove markdown blocks de código se a IA os colocar)
    content = content.replace(/^```(markdown|mdx)?\n/, '').replace(/\n```$/, '');

    // Extrai o título do frontmatter para criar o nome do arquivo
    const titleMatch = content.match(/title:\s*"([^"]+)"/);
    if (!titleMatch) {
      throw new Error("Não foi possível extrair o título do frontmatter.");
    }
    
    const title = titleMatch[1];
    const slug = getSlug(title);
    const fileName = `${slug}.mdx`;
    const filePath = path.join(BLOG_DIR, fileName);

    // Garante que o diretório exista
    if (!fs.existsSync(BLOG_DIR)) {
      fs.mkdirSync(BLOG_DIR, { recursive: true });
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Sucesso! Post gerado e salvo em: ${filePath}`);

  } catch (error) {
    console.error("Erro crítico ao gerar o post:", error);
    process.exit(1);
  }
}

generatePost();
