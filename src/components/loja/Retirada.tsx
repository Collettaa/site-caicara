import { MapPin } from "lucide-react";
import { siteConfig } from "@/lib/site";

const endereco = `${siteConfig.address.streetAddress}, ${siteConfig.address.locality}`;

export function Retirada() {
  return (
    <div className="border-l-4 border-[#f8d808] bg-black p-5 text-zinc-300">
      <p className="font-heading text-xl font-bold uppercase tracking-tight text-white">Sem frete: pega no próximo treino.</p>
      <p className="mt-2 inline-flex items-start gap-2">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#f8d808]" />
        <span>{endereco}</span>
      </p>
      <p className="mt-2 text-sm text-zinc-400">Troca de tamanho em até 7 dias, conforme estoque.</p>
    </div>
  );
}
