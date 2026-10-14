import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_ADMIN, sessaoValida } from "@/lib/admin-auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (sessaoValida((await cookies()).get(COOKIE_ADMIN)?.value, new Date())) redirect("/admin");

  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="container">
        <h1 className="mb-8 text-center font-heading text-4xl font-black uppercase tracking-tight sm:text-5xl">
          Admin da loja
        </h1>
        <LoginForm />
      </div>
    </section>
  );
}
