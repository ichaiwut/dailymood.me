import { requireAdmin } from "@/lib/admin-auth";
import {
  getOverviewStats,
  getDauApproximation,
  getRecentUsers,
  getStripeRevenueMTD,
} from "@/lib/admin-queries";
import { OverviewShell } from "@/components/admin/overview-shell";

export default async function AdminDashboard() {
  await requireAdmin();

  const [stats, dauData, recentUsers, revenue] = await Promise.all([
    getOverviewStats(),
    getDauApproximation(30),
    getRecentUsers(5),
    getStripeRevenueMTD(),
  ]);

  return (
    <OverviewShell
      stats={stats}
      dauData={dauData}
      recentUsers={recentUsers}
      revenue={revenue}
    />
  );
}
