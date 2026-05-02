import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { SignInButton } from "@/components/sign-in-button";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    const locale = await getLocale();
    redirect({ href: "/", locale });
  }

  return <LoginContent />;
}

function LoginContent() {
  const t = useTranslations("auth");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t("welcome")}</h1>
        <p className="mt-3 text-zinc-500">{t("signInDescription")}</p>
        <div className="mt-8">
          <SignInButton />
        </div>
        <p className="mt-6 text-xs text-zinc-400">{t("guestNotice")}</p>
      </div>
    </main>
  );
}
