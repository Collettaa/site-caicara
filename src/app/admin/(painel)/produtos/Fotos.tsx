"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { adicionarFotoAction, capaAction, removerFotoAction } from "./actions";

const MAX_BYTES = 8 * 1024 * 1024;

export function Fotos({ produtoId, fotos }: { produtoId: number; fotos: string[] }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [progresso, setProgresso] = useState<string | null>(null);
  const [erros, setErros] = useState<string[]>([]);
  const [mexendo, iniciar] = useTransition();

  async function enviar(arquivos: File[]) {
    const falhas: string[] = [];
    // Uma por vez: cada envio fica abaixo do limite de corpo das server actions.
    for (const [i, arquivo] of arquivos.entries()) {
      setProgresso(`Enviando ${i + 1} de ${arquivos.length}…`);
      if (arquivo.size > MAX_BYTES) {
        falhas.push(`${arquivo.name}: grande demais (máximo 8 MB).`);
        continue;
      }
      const fd = new FormData();
      fd.set("foto", arquivo);
      try {
        const r = await adicionarFotoAction(produtoId, fd);
        if (r?.erro) falhas.push(`${arquivo.name}: ${r.erro}`);
      } catch {
        falhas.push(`${arquivo.name}: não deu pra enviar. Tenta de novo.`);
      }
    }
    setProgresso(null);
    setErros(falhas);
    if (entrada.current) entrada.current.value = "";
  }

  const ocupado = progresso !== null || mexendo;

  return (
    <div className="grid gap-4">
      {fotos.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fotos.map((url, i) => (
            <li key={url} className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Foto ${i + 1}`} className="aspect-square w-full object-cover" />
              {i === 0 ? (
                <span className="absolute left-2 top-2 rounded-full bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                  Capa
                </span>
              ) : (
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => iniciar(() => capaAction(produtoId, url))}
                  className="absolute left-2 top-2 inline-flex h-10 items-center gap-1 rounded-full bg-white/90 px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-black shadow disabled:opacity-60"
                >
                  <Star className="h-4 w-4" />
                  Capa
                </button>
              )}
              <button
                type="button"
                disabled={ocupado}
                aria-label="Tirar foto"
                onClick={() => {
                  if (confirm("Tirar essa foto do produto?")) iniciar(() => removerFotoAction(produtoId, url));
                }}
                className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black shadow disabled:opacity-60"
              >
                <X className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-zinc-600">Nenhuma foto ainda. A primeira vira a capa na loja.</p>
      )}

      <input
        ref={entrada}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const arquivos = Array.from(e.target.files ?? []);
          if (arquivos.length) void enviar(arquivos);
        }}
      />
      <button
        type="button"
        disabled={ocupado}
        onClick={() => entrada.current?.click()}
        className="inline-flex h-14 items-center justify-center gap-3 rounded-full border-2 border-black bg-white px-8 text-sm font-bold uppercase tracking-[0.14em] text-black disabled:opacity-60"
      >
        {ocupado ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
        {progresso ?? "Adicionar fotos"}
      </button>
      {erros.map((e) => (
        <p key={e} className="text-sm font-semibold text-red-600">
          {e}
        </p>
      ))}
    </div>
  );
}
