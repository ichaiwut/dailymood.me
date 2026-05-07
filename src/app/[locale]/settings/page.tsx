import { redirect } from "next/navigation";
import { getSessionInfo } from "@/lib/tier";
import { CustomMoodManager } from "@/components/custom-mood-manager";
import { useTranslations } from "next-intl";

export const runtime = "edge";

export default async function SettingsPage() {
  const { tier, userId } = await getSessionInfo();
  if (!userId) redirect("/login");
  return <SettingsInner isPremium={tier === "premium"} />;
}

function SettingsInner({ isPremium }: { isPremium: boolean }) {
  const t = useTranslations("settings");
  return (
    <main className="flex-1 px-5 pb-16">
      <div className="mx-auto w-full max-w-[768px]">
        <h1
          className="leading-[1.1] mt-6 mb-7 fade-in"
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "var(--ink)",
          }}
        >
          {t("title")}
        </h1>

        {isPremium ? (
          <CustomMoodManager />
        ) : (
          <div
            className="px-6 py-7 fade-in"
            style={{
              background: "var(--surface)",
              borderRadius: 28,
              boxShadow: "var(--shadow-card)",
            }}
          >
            <p
              className="text-base leading-snug"
              style={{ color: "var(--ink-2)" }}
            >
              {t("premiumOnly")}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
