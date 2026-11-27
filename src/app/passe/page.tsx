import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { PasseForm } from "@/components/passe/PasseForm";
import { diasDisponiveis, passeTreinao, TRANQUILAS } from "@/lib/passe-treinao";

// Dias de amanhã até 07/12: calcula a cada acesso.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Passe do Treinão | 1 semana grátis",
  description: "Você fez o Treinão do Bambu. Agora vem treinar com a gente: 1 semana grátis na Caiçara Fit, em São Vicente.",
  alternates: { canonical: "/passe" },
  robots: { index: false, follow: false },
};

export default function PassePage() {
  const dias = diasDisponiveis(new Date());

  return (
    <div className="min-h-screen bg-[#111111] px-4 pb-20 pt-24 text-white sm:pt-28">
      {dias.length > 0 ? (
        <PasseForm dias={dias} tranquilas={[...TRANQUILAS]} comecarAte={passeTreinao.comecarAteLabel} />
      ) : (
        <div className="mx-auto max-w-md rounded-[1.25rem] bg-[#F8D808] p-8 text-[#111111]">
          <p className="font-heading text-4xl font-black uppercase leading-none">O passe acabou em {passeTreinao.comecarAteLabel}</p>
          <p className="mt-3">A semana grátis continua: chama a gente no WhatsApp e marca sua aula.</p>
        </div>
      )}

      <div className="mx-auto mt-14 grid max-w-md gap-3 border-t border-[#2A2A2A] pt-8 text-[#9A9A9A]">
        <p className="text-white">Nunca treinou? O coach adapta cada movimento pro seu ritmo, ninguém fica pra trás.</p>
        <a href={passeTreinao.mapa} className="inline-flex items-start gap-2 hover:text-white">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#F8D808]" />
          {passeTreinao.endereco}
        </a>
      </div>
    </div>
  );
}
