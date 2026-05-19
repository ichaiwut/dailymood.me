import { requireAdmin } from "@/lib/admin-auth";
import { AdminArticlesShell } from "@/components/admin/admin-articles-shell";

export default async function AdminArticlesPage() {
  await requireAdmin();
  return <AdminArticlesShell />;
}
