import { sairAction } from "../login/actions";

// Provisório: a Task 9 troca pela tela de pedidos.
export default function PainelPage() {
  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="container flex flex-col items-start gap-6">
        <h1 className="font-heading text-4xl font-black uppercase tracking-tight sm:text-5xl">Painel da loja</h1>
        <form action={sairAction}>
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 bg-white px-6 text-sm font-bold uppercase tracking-[0.14em] text-black hover:border-black"
          >
            Sair
          </button>
        </form>
      </div>
    </section>
  );
}
