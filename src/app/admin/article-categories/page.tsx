import { requireAdmin } from "@/lib/admin-auth";
import { AdminArticleCategoriesShell } from "@/components/admin/admin-article-categories-shell";

export default async function AdminArticleCategoriesPage() {
  await requireAdmin();
  return <AdminArticleCategoriesShell />;
}
