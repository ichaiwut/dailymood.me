import type { Metadata } from "next";
import { getSessionInfo } from "@/lib/tier";
import { ArticlesShell } from "@/components/articles-shell";

export const metadata: Metadata = {
  title: "บทความดูแลสุขภาพใจ — Dailymood",
  description: "เคล็ดลับดูแลสุขภาพใจสั้นๆ จากทีม DailyMood อ่านจบใน 5 นาที",
  robots: { index: true, follow: true },
  openGraph: {
    title: "บทความดูแลสุขภาพใจ — Dailymood",
    description: "เคล็ดลับดูแลสุขภาพใจสั้นๆ จากทีม DailyMood อ่านจบใน 5 นาที",
  },
};

export default async function ArticlesPage() {
  const { userId } = await getSessionInfo();
  return <ArticlesShell isGuest={!userId} />;
}
