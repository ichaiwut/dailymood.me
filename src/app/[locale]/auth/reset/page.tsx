import { ResetForm } from "@/components/reset-form";


export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-10">
      <ResetForm token={token ?? ""} />
    </main>
  );
}
