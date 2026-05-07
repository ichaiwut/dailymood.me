import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { LoginForm } from "@/components/login-form";

export const runtime = "edge";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    const locale = await getLocale();
    redirect({ href: "/", locale });
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-10">
      <LoginForm />
    </main>
  );
}
