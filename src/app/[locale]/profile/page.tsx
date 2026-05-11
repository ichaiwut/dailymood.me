import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { ProfileShell } from "@/components/profile-shell";
import { getTranslations } from "next-intl/server";


export default async function ProfilePage() {
  const { userId } = await getSessionInfo();
  const locale = await getLocale();

  if (!userId) {
    redirect({ href: "/login", locale });
  }

  const t = await getTranslations("profile");

  return (
    <main className="flex-1 px-5 pb-28">
      <div className="mx-auto w-full max-w-[768px]">
        <div
          className="fade-in"
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            paddingTop: 8, paddingBottom: 4,
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            {t("title")}
          </h1>
          <a
            href={`/${locale}/profile/edit`}
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: "var(--surface-2)", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", textDecoration: "none",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="var(--ink-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="var(--ink-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
        <ProfileShell />
      </div>
    </main>
  );
}
