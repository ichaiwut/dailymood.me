import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

function isAdmin(email: string): boolean {
  return adminEmails().has(email.toLowerCase());
}

export async function requireAdmin(): Promise<string> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase() ?? "";
  if (!email) redirect("/login");
  if (!isAdmin(email)) redirect("/login");
  return email;
}

export async function requireAdminAction(): Promise<string> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase() ?? "";
  if (!email || !isAdmin(email)) throw new Error("Unauthorized");
  return email;
}
