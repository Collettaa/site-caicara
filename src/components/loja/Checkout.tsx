"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { reais } from "./reais";
import type { ItemCarrinho } from "./useCarrinho";

type Forma = "pix" | "cartao1" | "cartao2";

interface Props {
  itens: ItemCarrinho[];
  totalPix: number;
  totalCartao: number;
  parcelas: number;
  /** Pedido criado: limpa o carrinho (a navegação já foi pedida). */
  onPedido: () => void;
}

const campoClass = "h-14 rounded-2xl border border-zinc-300 px-4 text-lg outline-none focus:border-black";
const rotuloClass = "text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500";

const formaClass = (ativo: boolean) =>
  `flex items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition-colors ${
    ativo ? "border-black bg-black text-white" : "border-zinc-300 bg-white text-zinc-800 hover:border-black"
  }`;

export function Checkout({ itens, totalPix, totalCartao, parcelas, onPedido }: Props) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cpf, setCpf] = useState("");
  const [aceitaMsgs, setAceitaMsgs] = useState(false);
  const [escolha, setEscolha] = useState<Forma>("pix");
  const [site, setSite] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  // 2x some se o carrinho mudou e não permite mais.
  const forma: Forma = escolha === "cartao2" && parcelas < 2 ? "cartao1" : escolha;

  const formas: { valor: Forma; titulo: string; valorTexto: string }[] = [
    { valor: "pix", titulo: "Pix", valorTexto: reais(totalPix) },
    { valor: "cartao1", titulo: "Cartão 1x", valorTexto: reais(totalCartao) },
    ...(parcelas >= 2
      ? [{ valor: "cartao2" as const, titulo: "Cartão 2x", valorTexto: `2x de ${reais(Math.ceil(totalCartao / 2))}` }]
      : []),
  ];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const response = await fetch("/api/loja/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          whatsapp,
          cpf,
          aceitaMsgs,
          forma,
          itens: itens.map((i) => ({ variacaoId: i.variacaoId, qtd: i.qtd })),
          site,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const texto = typeof data.error === "string" ? data.error : "Não deu pra fechar o pedido. Tenta de novo.";
        setError(data.motivo === "estoque" ? `Esgotou 😕 ${texto}` : texto);
        setEnviando(false);
        return;
      }
      if (typeof data.codigo !== "string") {
        setEnviando(false);
        return;
      }
      router.push(`/loja/pedido/${data.codigo}`);
      onPedido();
    } catch {
      setError("Sem conexão. Tenta de novo.");
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5 sm:p-8"
    >
      <h2 className="font-heading text-3xl font-black uppercase tracking-tight">Fechar pedido</h2>
      <div className="mt-6 grid gap-5">
        <label className="grid gap-2">
          <span className={rotuloClass}>Nome</span>
          <input
            required
            name="nome"
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={campoClass}
            placeholder="Seu nome"
          />
        </label>

        <label className="grid gap-2">
          <span className={rotuloClass}>WhatsApp</span>
          <input
            required
            name="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className={campoClass}
            placeholder="(13) 99999-9999"
          />
        </label>

        <label className="grid gap-2">
          <span className={rotuloClass}>CPF</span>
          <input
            required
            name="cpf"
            inputMode="numeric"
            autoComplete="off"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            className={campoClass}
            placeholder="000.000.000-00"
          />
          <span className="text-sm text-zinc-500">Só para gerar o pagamento. Não fica salvo aqui.</span>
        </label>

        <fieldset className="grid gap-2">
          <legend className={`mb-2 ${rotuloClass}`}>Como vai pagar?</legend>
          <div className="grid gap-3">
            {formas.map((f) => (
              <button key={f.valor} type="button" className={formaClass(forma === f.valor)} onClick={() => setEscolha(f.valor)}>
                <span className="text-sm font-bold uppercase tracking-[0.1em]">{f.titulo}</span>
                <span className="text-lg font-bold">{f.valorTexto}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <label className="flex items-start gap-3 text-zinc-700">
          <input
            type="checkbox"
            checked={aceitaMsgs}
            onChange={(e) => setAceitaMsgs(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-black"
          />
          Aceito receber mensagens sobre este pedido no WhatsApp
        </label>

        <input
          type="text"
          name="site"
          tabIndex={-1}
          autoComplete="off"
          value={site}
          onChange={(e) => setSite(e.target.value)}
          className="hidden"
          aria-hidden="true"
        />

        {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={enviando}
          className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-caicara-yellow px-8 text-sm font-bold uppercase tracking-[0.14em] text-black transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {forma === "pix" ? "Gerar Pix" : "Ir para o pagamento"}
        </button>
        <p className="text-center text-xs text-zinc-500">A peça fica reservada por 1 hora até o pagamento.</p>
      </div>
    </form>
  );
}
