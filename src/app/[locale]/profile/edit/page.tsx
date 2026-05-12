import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionInfo } from "@/lib/tier";
import { ProfileEditShell } from "@/components/profile-edit-shell";


export default async function EditProfilePage() {
  const { userId } = await getSessionInfo();
  const locale = await getLocale();

  if (!userId) {
    redirect({ href: "/login", locale });
  }

  return <ProfileEditShell />;
}
