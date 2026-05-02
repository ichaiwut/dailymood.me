import { useTranslations } from "next-intl";
import { MoodPicker } from "@/components/mood-picker";

export default function Home() {
  const t = useTranslations("home");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {t("greeting")}
      </h1>
      <p className="mt-2 text-zinc-500">
        {t("selectMood")}
      </p>
      <div className="mt-10 w-full">
        <MoodPicker />
      </div>
    </main>
  );
}
