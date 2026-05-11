import { requireAdmin } from "@/lib/admin-auth";
import { PacksShell } from "@/components/admin/packs-shell";


export default async function AdminPacksPage() {
  await requireAdmin();
  return <PacksShell />;
}
