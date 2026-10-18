"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Recarrega a lista a cada 20 s: pagamento novo aparece sozinho. */
export function Atualizar() {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 20000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}
