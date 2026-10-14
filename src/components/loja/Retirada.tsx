import { MapPin } from "lucide-react";
import { siteConfig } from "@/lib/site";

const endereco = `${siteConfig.address.streetAddress}, ${siteConfig.address.locality}`;

export function Retirada() {
  return (
    <div className="rounded-2xl bg-zinc-950 p-5 text-zinc-300">
      <p className="inline-flex items-start gap-2">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-caicara-yellow" />
        <span>
          <strong className="text-white">Retirada no box:</strong> {endereco}.
        </span>
      </p>
      <p className="mt-2 text-sm text-zinc-400">Troca de tamanho em até 7 dias, conforme estoque.</p>
    </div>
  );
}
