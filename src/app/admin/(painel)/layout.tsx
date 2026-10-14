import { exigirAdmin } from "@/lib/admin-auth";
import { AdminNav } from "./AdminNav";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  await exigirAdmin();
  return (
    <>
      <AdminNav />
      <div className="min-h-[60vh] bg-zinc-50 pb-16">{children}</div>
    </>
  );
}
