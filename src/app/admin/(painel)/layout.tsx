import { exigirAdmin } from "@/lib/admin-auth";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  await exigirAdmin();
  return children;
}
