"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

interface UserMenuProps {
  user: {
    name?: string | null;
    image?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const t = useTranslations("common");

  return (
    <div className="flex items-center gap-3">
      {user.image && (
        <img
          src={user.image}
          alt={user.name || ""}
          className="h-8 w-8 rounded-full"
        />
      )}
      <span className="text-sm font-medium text-zinc-700">{user.name}</span>
      <button
        onClick={() => signOut()}
        className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
      >
        {t("logout")}
      </button>
    </div>
  );
}
