import { auth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { TopBarClient } from "./topbar-client";

export async function TopBar() {
  const session = await auth();

  return (
    <header className="px-5 pt-5">
      <div className="mx-auto w-full max-w-[768px]">
        {session?.user ? (
          <TopBarClient
            name={session.user.name ?? null}
            image={session.user.image ?? null}
            email={session.user.email ?? null}
          />
        ) : (
          <div className="flex justify-end">
            <Link
              href="/login"
              className="text-base font-semibold px-5 py-2 rounded-full"
              style={{
                background: "var(--surface)",
                color: "var(--ink)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
