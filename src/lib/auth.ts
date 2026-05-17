import NextAuth, { CredentialsSignin } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { getDb } from "@/lib/cf";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ulid } from "@/lib/ulid";
import { verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { notifyAdmin } from "@/lib/line";

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}
class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}
class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google,
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = (creds?.email as string | undefined)?.trim().toLowerCase();
        const password = creds?.password as string | undefined;
        if (!email || !password) throw new InvalidCredentialsError();
        if (password.length > 1024) throw new InvalidCredentialsError();

        const rl = await rateLimit({ key: `login:${email}`, limit: 10, windowSec: 900 });
        if (!rl.ok) throw new RateLimitedError();

        const db = getDb();
        const [u] = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            image: users.image,
            passwordHash: users.passwordHash,
            emailVerified: users.emailVerified,
          })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!u || !u.passwordHash) throw new InvalidCredentialsError();
        const ok = await verifyPassword(password, u.passwordHash);
        if (!ok) throw new InvalidCredentialsError();
        if (!u.emailVerified) throw new EmailNotVerifiedError();

        return { id: u.id, email: u.email, name: u.name, image: u.image };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // On Google sign-in, upsert the D1 users row by email and pin token.sub
    // to our internal user id so all FK references resolve.
    // Credentials sign-in already returns our internal id as user.id.
    async jwt({ token, user, account }) {
      if (account?.provider === "credentials" && user?.id) {
        token.sub = user.id;
        return token;
      }
      if (user?.email) {
        const db = getDb();
        const [existing] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (existing) {
          token.sub = existing.id;
        } else {
          const id = ulid();
          await db.insert(users).values({
            id,
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
            emailVerified: new Date(), // OAuth providers vouch for email
          });
          token.sub = id;
          notifyAdmin(`🆕 มีคนสมัครใหม่ (Google)`);
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
