import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de Privacidade do site Caiçara Fit. Saiba como coletamos, usamos e protegemos seus dados.",
  robots: { index: true, follow: true },
};

export default function PoliticaDePrivacidade() {
  return (
    <div className="container max-w-3xl py-20">
      <Link
        href="/"
        className="mb-10 inline-flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-caicara-yellow"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para o início
      </Link>

      <h1 className="mb-6 font-heading text-4xl font-black uppercase tracking-tight text-gray-900 sm:text-5xl">
        Política de Privacidade
      </h1>
      <p className="mb-12 text-sm text-gray-500">
        Última atualização: 12 de maio de 2026
      </p>

      <div className="prose prose-lg prose-gray max-w-none prose-headings:font-heading prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-tight">
        <h2>1. Introdução</h2>
        <p>
          A <strong>Caiçara Fit</strong> (&ldquo;nós&rdquo;, &ldquo;nosso&rdquo;) opera o site{" "}
          <a href="https://caicara.store">caicara.store</a>. Esta página informa
          sobre nossas políticas relativas à coleta, uso e divulgação de dados
          pessoais quando você utiliza nosso site, e as escolhas que você tem
          associadas a esses dados.
        </p>

        <h2>2. Dados que coletamos</h2>
        <p>Podemos coletar os seguintes tipos de informação:</p>
        <ul>
          <li>
            <strong>Dados de uso:</strong> informações sobre como você acessa e
            navega pelo site (páginas visitadas, tempo de permanência, origem do
            acesso).
          </li>
          <li>
            <strong>Dados de dispositivo:</strong> tipo de navegador, sistema
            operacional, resolução de tela e endereço IP.
          </li>
          <li>
            <strong>Cookies e tecnologias semelhantes:</strong> pequenos arquivos
            armazenados no seu dispositivo para melhorar a experiência de
            navegação e veicular anúncios relevantes.
          </li>
        </ul>

        <h2>3. Como usamos seus dados</h2>
        <p>Utilizamos as informações coletadas para:</p>
        <ul>
          <li>Manter e melhorar o funcionamento do site;</li>
          <li>Analisar o uso e o desempenho do site;</li>
          <li>Exibir anúncios personalizados por meio do Google AdSense;</li>
          <li>Cumprir obrigações legais aplicáveis.</li>
        </ul>

        <h2>4. Cookies e tecnologias de terceiros</h2>
        <p>
          Nosso site utiliza cookies próprios e de terceiros. Especificamente:
        </p>
        <ul>
          <li>
            <strong>Google AdSense:</strong> utiliza cookies para exibir
            anúncios com base em visitas anteriores ao nosso site ou a outros
            sites na internet. O Google e seus parceiros podem usar cookies para
            veicular anúncios com base no histórico de navegação do usuário.
          </li>
          <li>
            <strong>Google Analytics:</strong> utilizamos o Google Analytics para
            coletar dados estatísticos de acesso ao site. Essas informações são
            utilizadas de forma agregada e anônima.
          </li>
        </ul>
        <p>
          Você pode desativar a publicidade personalizada acessando as{" "}
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noopener noreferrer"
          >
            Configurações de anúncios do Google
          </a>
          . Para mais informações sobre como o Google usa dados de sites
          parceiros, acesse:{" "}
          <a
            href="https://www.google.com/policies/privacy/partners/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Como o Google usa informações de sites ou apps que utilizam nossos
            serviços
          </a>
          .
        </p>

        <h2>5. Compartilhamento de dados</h2>
        <p>
          Não vendemos, comercializamos ou transferimos seus dados pessoais para
          terceiros, exceto nas seguintes situações:
        </p>
        <ul>
          <li>
            Parceiros de publicidade (Google AdSense) para exibição de anúncios;
          </li>
          <li>
            Ferramentas de análise (Google Analytics) para entender o
            comportamento dos visitantes;
          </li>
          <li>
            Quando exigido por lei ou para proteger nossos direitos legais.
          </li>
        </ul>

        <h2>6. Seus direitos (LGPD)</h2>
        <p>
          De acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018), você
          tem direito a:
        </p>
        <ul>
          <li>Confirmar a existência de tratamento de dados;</li>
          <li>Acessar seus dados pessoais;</li>
          <li>Solicitar a correção de dados incompletos ou desatualizados;</li>
          <li>Solicitar a eliminação de dados desnecessários;</li>
          <li>Revogar o consentimento a qualquer momento.</li>
        </ul>
        <p>
          Para exercer qualquer um desses direitos, entre em contato pelo
          WhatsApp:{" "}
          <a
            href="https://api.whatsapp.com/send?phone=5513920013547&text=Ol%C3%A1!%20Gostaria%20de%20tratar%20sobre%20meus%20dados%20pessoais."
            target="_blank"
            rel="noopener noreferrer"
          >
            (13) 92001-3547
          </a>
          .
        </p>

        <h2>7. Segurança</h2>
        <p>
          Adotamos medidas de segurança técnicas e organizacionais para proteger
          seus dados pessoais contra acesso não autorizado, perda ou destruição.
          No entanto, nenhuma transmissão de dados pela internet é 100% segura.
        </p>

        <h2>8. Links externos</h2>
        <p>
          Nosso site pode conter links para sites externos. Não nos
          responsabilizamos pelas práticas de privacidade de outros sites.
          Recomendamos a leitura das políticas de privacidade de cada site
          visitado.
        </p>

        <h2>9. Alterações nesta política</h2>
        <p>
          Podemos atualizar esta Política de Privacidade periodicamente.
          Notificaremos sobre alterações publicando a nova versão nesta página
          com a data da última atualização.
        </p>

        <h2>10. Contato</h2>
        <p>
          Se tiver dúvidas sobre esta Política de Privacidade, entre em contato:
        </p>
        <ul>
          <li>
            <strong>E-mail:</strong> contato via WhatsApp (13) 92001-3547
          </li>
          <li>
            <strong>Endereço:</strong> Av. Embaixador Pedro de Toledo, 593 — São
            Vicente, SP — CEP 11320-440
          </li>
        </ul>
      </div>
    </div>
  );
}
