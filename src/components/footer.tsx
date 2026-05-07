import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer
      className="px-5 sm:px-8 py-10 mt-16"
      style={{ borderTop: "1px solid var(--hairline)" }}
    >
      <div className="mx-auto w-full max-w-[768px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div
            className="font-bold tracking-tight text-lg"
            style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}
          >
            Dailymood
          </div>
          <p
            className="mt-1 text-base"
            style={{ color: "var(--ink-3)" }}
          >
            © {year} Dailymood. {t("tagline")}
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-base">
          <FooterLink href="/settings">{t("settings")}</FooterLink>
          <FooterLink href="/">{t("privacy")}</FooterLink>
          <FooterLink href="/">{t("terms")}</FooterLink>
          <FooterLink href="mailto:hello@dailymood.me">{t("contact")}</FooterLink>
        </nav>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="font-medium transition"
      style={{ color: "var(--ink-2)" }}
    >
      {children}
    </Link>
  );
}
