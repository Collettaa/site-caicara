import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PedidoStatus } from "@/components/loja/PedidoStatus";
import { CODIGO_VALIDO } from "@/lib/loja/api";

export const metadata: Metadata = {
  title: "Seu pedido",
  robots: { index: false, follow: false },
};

export default async function PedidoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  if (!CODIGO_VALIDO.test(codigo)) notFound();

  return (
    <section className="loja-areia py-8 sm:py-12">
      <div className="container">
        <h1 className="mb-8 font-heading text-5xl font-bold uppercase leading-[0.95] sm:text-6xl">Seu pedido</h1>
        <PedidoStatus codigo={codigo} />
      </div>
    </section>
  );
}
