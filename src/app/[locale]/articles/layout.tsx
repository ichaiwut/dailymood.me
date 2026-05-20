import { auth } from "@/lib/auth";
import { TopBar } from "@/components/topbar";
import { BottomNav } from "@/components/bottom-nav";
import { SiteFooter } from "@/components/site-footer";

export default async function ArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user) {
    return <>{children}</>;
  }

  return (
    <>
      <TopBar />
      <main className="w-container main-content" style={{ flex: 1, position: "relative", zIndex: 0 }}>
        {children}
      </main>
      <SiteFooter />
      <BottomNav />
    </>
  );
}
