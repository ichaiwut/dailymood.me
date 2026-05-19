import { requireAdmin } from "@/lib/admin-auth";
import { AdminArticleEditorShell } from "@/components/admin/admin-article-editor-shell";

export default async function AdminArticleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  return <AdminArticleEditorShell articleId={id} />;
}
