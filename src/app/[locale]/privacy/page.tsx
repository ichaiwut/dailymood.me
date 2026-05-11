import { PrivacyPage } from "@/components/privacy-page";

export const runtime = "edge";

export default function Privacy() {
  return (
    <main className="flex-1 px-5 pb-28">
      <div className="mx-auto w-full max-w-[768px]">
        <PrivacyPage />
      </div>
    </main>
  );
}
