import { auth } from "@/lib/auth";
import { UserMenu } from "./user-menu";
import { Link } from "@/i18n/navigation";

// 4-dot logo mark — matches Freud kit identity language
function LogoMark() {
  return (
    <span
      aria-hidden
      className="grid grid-cols-2 gap-[3px]"
      style={{ width: 18, height: 18 }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <span
          key={i}
          className="block rounded-full"
          style={{ width: 7, height: 7, background: "var(--ink)" }}
        />
      ))}
    </span>
  );
}

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="px-5 sm:px-8 py-5">
      <div className="mx-auto w-full max-w-[768px] flex items-center justify-between">
      <Link
        href="/"
        className="flex items-center gap-2.5 text-lg font-bold tracking-tight"
        style={{ color: "var(--ink)" }}
      >
        <LogoMark />
        Dailymood
      </Link>
      <div>
        {session?.user ? (
          <UserMenu user={session.user} />
        ) : (
          <Link
            href="/login"
            className="text-sm font-semibold px-4 py-2 rounded-full"
            style={{
              background: "var(--surface)",
              color: "var(--ink)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            Sign in
          </Link>
        )}
      </div>
      </div>
    </nav>
  );
}
