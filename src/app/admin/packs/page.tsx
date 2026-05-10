import { requireAdmin } from "@/lib/admin-auth";
import { PacksShell } from "@/components/admin/packs-shell";

export const runtime = "edge";

export default async function AdminPacksPage() {
  await requireAdmin();
  return <PacksShell />;
}
