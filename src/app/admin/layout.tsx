import { requireAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";


export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const email = await requireAdmin();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <AdminSidebar email={email} />
      <main
        style={{
          flex: 1,
          marginLeft: 240,
          background: "var(--bg)",
          padding: "24px 28px 64px",
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>{children}</div>
      </main>
    </div>
  );
}
