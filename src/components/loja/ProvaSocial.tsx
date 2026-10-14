import { Star } from "lucide-react";

export function ProvaSocial() {
  return (
    <p className="inline-flex items-center gap-2 text-sm text-zinc-700">
      <span className="inline-flex text-[#e0b800]" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className="h-4 w-4 fill-current" />
        ))}
      </span>
      Nota 5.0 no Google, com mais de 100 avaliações do box.
    </p>
  );
}
