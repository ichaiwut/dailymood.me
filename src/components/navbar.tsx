import { auth } from "@/lib/auth";
import { UserMenu } from "./user-menu";
import { Link } from "@/i18n/navigation";

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="flex items-center justify-between px-6 py-4">
      <Link href="/" className="text-xl font-bold tracking-tight">
        Dailymood
      </Link>
      <div>
        {session?.user ? (
          <UserMenu user={session.user} />
        ) : (
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
